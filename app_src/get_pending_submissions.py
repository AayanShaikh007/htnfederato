import boto3
import json

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

if __name__ == "__main__":
    table = get_dynamodb_table()
    response = table.scan()
    items = response.get('Items', [])
    print(json.dumps(items, indent=2, default=str))
