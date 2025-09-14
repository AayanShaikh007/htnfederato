from strands import Agent, tool
from strands.models.openai import OpenAIModel
import os
from dotenv import load_dotenv
import boto3
from typing import Optional, Dict, List
from decimal import Decimal
import logging
import json
import traceback
from datetime import datetime

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('auto_underwriter.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# API KEYS
load_dotenv()
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

def get_dynamodb_table(table_name: str = 'unpolishedData'):
    """Get DynamoDB table connection"""
    session = boto3.Session(
        aws_access_key_id='fakeMyKeyId',
        aws_secret_access_key='fakeSecretAccessKey',
        region_name="us-west-2"
    )
    dynamodb = session.resource(
        'dynamodb',
        endpoint_url='http://localhost:8123'
    )
    return dynamodb.Table(table_name)

def apply_underwriting_rules(policy_data: dict, rules_content: str, agent: Agent) -> tuple:
    """Apply underwriting rules to a policy and return (decision, score, reasoning)"""
    
    prompt = f"""
    You are an expert insurance underwriter. Your task is to analyze a policy submission and decide if it's "SAFE" or "NOT SAFE".
    You must provide a score from 0 to 100, where 100 is a perfect submission with no risks.
    You must also provide a detailed reasoning for your decision.

    Here are the underwriting guidelines:
    {rules_content}

    Here is the policy submission:
    {json.dumps(policy_data, indent=2)}

    Based on the guidelines and the policy data, please provide your decision, score, and reasoning in a JSON format with the following keys:
    - "decision": "SAFE" or "NOT SAFE"
    - "score": an integer between 0 and 100
    - "reasoning": a string explaining your decision

    Your response must be a valid JSON object.
    """

    try:
        response = agent(prompt)
        result = json.loads(response)
        decision = result.get("decision", "NOT SAFE")
        score = result.get("score", 0)
        reasoning = result.get("reasoning", "No reasoning provided.")
        return decision, score, reasoning
    except Exception as e:
        logger.error(f"Error processing policy with LLM: {e}")
        return "NOT SAFE", 0, f"Error processing policy with LLM: {e}"

@tool
def auto_underwrite_all_policies(table_name: str = 'unpolishedData', results_table: str = 'underwritingResults') -> str:
    """Automatically underwrite all policies and save decisions to database"""
    try:
        # Get all policies
        table = get_dynamodb_table(table_name)
        response = table.scan()
        policies = response['Items']
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            policies.extend(response['Items'])
        
        if not policies:
            return f"No policies found in table {table_name}"
        
        # Read underwriting rules
        try:
            with open("rules.txt", "r", encoding="utf-8") as f:
                rules_content = f.read()
        except FileNotFoundError:
            rules_content = "Default rules: Basic risk assessment applied"
        
        # Set up results table
        session = boto3.Session(
            aws_access_key_id='fakeMyKeyId',
            aws_secret_access_key='fakeSecretAccessKey',
            region_name="us-west-2"
        )
        dynamodb = session.resource('dynamodb', endpoint_url='http://localhost:8123')
        
        try:
            existing_tables = [t.name for t in dynamodb.tables.all()]
            if results_table not in existing_tables:
                results_table_obj = dynamodb.create_table(
                    TableName=results_table,
                    KeySchema=[{'AttributeName': 'policy_id', 'KeyType': 'HASH'}],
                    AttributeDefinitions=[{'AttributeName': 'policy_id', 'AttributeType': 'S'}],
                    BillingMode='PAY_PER_REQUEST'
                )
                results_table_obj.wait_until_exists()
            else:
                results_table_obj = dynamodb.Table(results_table)
        except Exception as e:
            return f"Error setting up results table: {e}"
        
        # Process each policy automatically
        results_summary = {
            'total_processed': 0,
            'safe_count': 0,
            'not_safe_count': 0,
            'errors': []
        }
        
        for policy in policies:
            try:
                policy_id = str(policy.get('id', 'unknown'))
                
                # Convert Decimal objects
                def convert_decimals(obj):
                    if isinstance(obj, dict):
                        return {k: convert_decimals(v) for k, v in obj.items()}
                    elif isinstance(obj, Decimal):
                        return float(obj)
                    else:
                        return obj
                
                policy_data = convert_decimals(policy)
                
                # Apply underwriting rules automatically
                decision, score, reasoning = apply_underwriting_rules(policy_data, rules_content, agent)
                
                # Save decision to database
                results_table_obj.put_item(Item={
                    'policy_id': policy_id,
                    'policy_data': json.dumps(policy_data, default=str),
                    'classification': decision,
                    'score': score,
                    'reasoning': reasoning,
                    'timestamp': datetime.now().isoformat(),
                    'rules_applied': 'LLM-based assessment'
                })
                
                # Update counters
                results_summary['total_processed'] += 1
                if decision == 'SAFE':
                    results_summary['safe_count'] += 1
                else:
                    results_summary['not_safe_count'] += 1
                
                print(f"Policy {policy_id}: {decision}")
                
            except Exception as e:
                error_msg = f"Error processing policy {policy.get('id', 'unknown')}: {str(e)}"
                results_summary['errors'].append(error_msg)
                logger.error(error_msg)
        
        # Generate summary
        summary = f"""
AUTOMATIC UNDERWRITING COMPLETED
================================
Total Policies Processed: {results_summary['total_processed']}
✅ SAFE: {results_summary['safe_count']}
❌ NOT SAFE: {results_summary['not_safe_count']}
❌ Errors: {len(results_summary['errors'])}

Results saved to table: {results_table}
"""
        
        if results_summary['errors']:
            summary += "\nErrors encountered:\n" + "\n".join(results_summary['errors'][:3])
        
        return summary
        
    except Exception as e:
        return f"Error in automatic underwriting: {str(e)}"

@tool
def get_underwriting_summary(results_table: str = 'underwritingResults') -> str:
    """Get a summary of all underwriting decisions"""
    try:
        session = boto3.Session(
            aws_access_key_id='fakeMyKeyId',
            aws_secret_access_key='fakeSecretAccessKey',
            region_name="us-west-2"
        )
        dynamodb = session.resource('dynamodb', endpoint_url='http://localhost:8123')
        table = dynamodb.Table(results_table)
        
        response = table.scan()
        results = response['Items']
        
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            results.extend(response['Items'])
        
        if not results:
            return f"No underwriting results found in table {results_table}"
        
        # Summarize results
        safe_count = len([r for r in results if r.get('classification') == 'SAFE'])
        not_safe_count = len([r for r in results if r.get('classification') == 'NOT SAFE'])
        
        summary = f"""
UNDERWRITING SUMMARY
===================
Total Policies: {len(results)}
✅ SAFE: {safe_count} ({safe_count/len(results)*100:.1f}%)
❌ NOT SAFE: {not_safe_count} ({not_safe_count/len(results)*100:.1f}%)

DETAILED RESULTS:
"""
        
        for result in results:
            classification = result.get('classification', 'UNKNOWN')
            emoji = "✅" if classification == "SAFE" else "❌"
            summary += f"\n{emoji} Policy {result.get('policy_id')}: {classification}"
            if result.get('reasoning'):
                summary += f"\n   {result.get('reasoning', '')[:80]}..."
        
        return summary
        
    except Exception as e:
        return f"Error getting underwriting summary: {str(e)}"

# Check if required environment variable is set
if not COHERE_API_KEY:
    logger.error("COHERE_API_KEY not found in environment variables")
    print("Error: COHERE_API_KEY not found in environment variables")
    exit(1)

try:
    logger.info("Initializing Automatic Underwriting Agent...")
    model = OpenAIModel(
        client_args={
            "api_key": COHERE_API_KEY,
            "base_url": "https://api.cohere.ai/compatibility/v1"
        },
        model_id="command-a-03-2025",
        params={
            "max_tokens": 1000
        }
    )

    agent = Agent(model=model, tools=[
        auto_underwrite_all_policies,
        get_underwriting_summary
    ])

    print("🤖 AUTOMATIC Insurance Underwriting Agent Ready!")
    print("\nThis agent will automatically make SAFE/NOT SAFE decisions")
    print("\nAvailable commands:")
    print("- 'Underwrite all policies automatically'")
    print("- 'Show underwriting summary'")
    
    logger.info("Automatic underwriting agent ready")
    
    while True:
        user_input = input("\n🤖 Auto-underwriter command (or 'quit' to exit): ")
        if user_input.lower() in ['quit', 'exit', 'q']:
            logger.info("User requested exit")
            print("👋 Goodbye!")
            break
        
        try:
            logger.info(f"User input: {user_input}")
            response = agent(user_input)
            logger.info(f"Agent response length: {len(str(response))} characters")
            print(f"🤖 {response}")
        except Exception as e:
            error_msg = f"Error processing request: {e}"
            logger.error(f"{error_msg}")
            print(f"❌ {error_msg}")

except Exception as e:
    error_msg = f"Error initializing agent: {e}"
    logger.error(f"{error_msg}")
    print(f"❌ {error_msg}")