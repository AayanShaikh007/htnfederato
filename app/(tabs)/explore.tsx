import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Button } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const submissionsData = [
  { 
    id: 1,
    title: 'Acme Corp - General Liability',
    broker: 'Broker: Marsh',
    score: 'SAFE',
    scoreValue: 90,
    scoreType: 'safe',
    effectiveDate: '09/01/2025',
    expirationDate: '09/01/2026',
    customerInfo: { name: 'Acme Corp', address: '123 Main St, Anytown, USA', state: 'CA' },
    riskScore: 'Low',
    missingData: ['Employee count', 'Revenue last 5 years'],
    underwritingMetrics: { revenue: '$100M', employeeCount: '500', claimsHistory: 'No claims in last 3 years', tiv: 50000000, total_premium: 200000 },
    construction_type: 'frame',
    oldest_building: 1985,
    line_of_business: 'General Liability',
    reasoning: 'Policy meets all safety criteria.',
  },
  {
    id: 2,
    title: 'Cyberdyne Systems - Cyber Security',
    broker: 'Broker: Aon',
    score: 'SAFE',
    scoreValue: 95,
    scoreType: 'safe',
    effectiveDate: '10/15/2025',
    expirationDate: '10/15/2026',
    customerInfo: { name: 'Cyberdyne Systems', address: '456 Tech Rd, Future City, USA', state: 'TX' },
    riskScore: 'Medium',
    missingData: ['Cyber security audit report'],
    underwritingMetrics: { revenue: '$5B', employeeCount: '10000', claimsHistory: '1 claim in last 5 years', tiv: 80000000, total_premium: 300000 },
    construction_type: 'concrete',
    oldest_building: 2005,
    line_of_business: 'Cyber Security',
    reasoning: 'Policy meets all safety criteria.',
  },
  {
    id: 3,
    title: 'Stark Industries - Property',
    broker: 'Broker: Willis Towers Watson',
    score: 'NOT SAFE',
    scoreValue: 40,
    scoreType: 'not-safe',
    effectiveDate: '11/01/2025',
    expirationDate: '11/01/2026',
    customerInfo: { name: 'Stark Industries', address: '10880 Malibu Point, Malibu, USA', state: 'CA' },
    riskScore: 'High',
    missingData: ['Building blueprints', 'Fire safety inspection report'],
    underwritingMetrics: { revenue: '$200B', employeeCount: '50000', claimsHistory: '5 claims in last 5 years', tiv: 120000000, total_premium: 1000000 },
    construction_type: 'steel',
    oldest_building: 2010,
    line_of_business: 'Property',
    reasoning: 'TIV of 120000000 exceeds $100M limit without special approval',
  },
  {
    id: 4,
    title: 'Wayne Enterprises - Umbrella',
    broker: 'Broker: Gallagher',
    score: 'NOT SAFE',
    scoreValue: 40,
    scoreType: 'not-safe',
    effectiveDate: '12/01/2025',
    expirationDate: '12/01/2026',
    customerInfo: { name: 'Wayne Enterprises', address: '1007 Mountain Drive, Gotham, USA', state: 'NY' },
    riskScore: 'Low',
    missingData: [],
    underwritingMetrics: { revenue: '$150B', employeeCount: '40000', claimsHistory: '2 claims in last 5 years', tiv: 90000000, total_premium: 150000 },
    construction_type: 'masonry',
    oldest_building: 1995,
    line_of_business: 'Umbrella',
    reasoning: 'Winnability score of 40 is below minimum threshold of 50',
  },
];

const applyUnderwritingRules = (submission: any) => {
  const { underwritingMetrics, construction_type, oldest_building, customerInfo, scoreValue } = submission;
  const { tiv, total_premium } = underwritingMetrics;
  const { state } = customerInfo;

  const premium_ratio = tiv > 0 ? (total_premium / tiv) * 100 : 0;

  if (tiv > 100000000) {
    return {
      score: "NOT SAFE",
      scoreType: "not-safe",
      reasoning: `TIV of ${tiv} exceeds $100M limit without special approval`,
    };
  }

  if (oldest_building < 1950 && ['CA', 'FL', 'TX'].includes(state)) {
    return {
      score: "NOT SAFE",
      scoreType: "not-safe",
      reasoning: `Building from ${oldest_building} in high-risk state ${state} - too old`,
    };
  }

  if (scoreValue < 50) {
    return {
      score: "NOT SAFE",
      scoreType: "not-safe",
      reasoning: `Winnability score of ${scoreValue} is below minimum threshold of 50`,
    };
  }

  if (premium_ratio < 0.3) {
    return {
      score: "NOT SAFE",
      scoreType: "not-safe",
      reasoning: `Premium ratio of ${premium_ratio.toFixed(2)}% is below 0.3% - inadequate pricing`,
    };
  }

  if (construction_type.includes('frame') && oldest_building < 1970 && state === 'CA') {
    return {
      score: "NOT SAFE",
      scoreType: "not-safe",
      reasoning: "Frame construction + pre-1970 building + California = high earthquake risk",
    };
  }

  return {
    score: "SAFE",
    scoreType: "safe",
    reasoning: "Policy meets all safety criteria.",
  };
};

const submissions = submissionsData.map(submission => {
  const newScores = applyUnderwritingRules(submission);
  return { ...submission, ...newScores };
});

const getScoreStyle = (scoreType: string) => {
  switch (scoreType) {
    case 'winnability':
      return styles.winnabilityScore;
    case 'safe':
      return styles.safeScore;
    case 'not-safe':
      return styles.notSafeScore;
    default:
      return {};
  }
};

export default function FedoratoDashboard() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const openModal = (submission) => {
    setSelectedSubmission(submission);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedSubmission(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Fedorato Dashboard</ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>Submissions Inbox</ThemedText>
      <View style={styles.listContainer}>
        {submissions.map((submission) => (
          <TouchableOpacity key={submission.id} onPress={() => openModal(submission)}>
            <View style={styles.submissionItem}>
              <View style={styles.submissionDetails}>
                <ThemedText type="defaultSemiBold">{submission.title}</ThemedText>
                <ThemedText type="default">{submission.broker}</ThemedText>
                <ThemedText type="default">Effective Date: {submission.effectiveDate}</ThemedText>
                <ThemedText type="default">Expiration Date: {submission.expirationDate}</ThemedText>
              </View>
              <View style={[styles.scoreContainer, getScoreStyle(submission.scoreType)]}>
                <Text style={styles.scoreText}>{submission.score} ({submission.scoreValue})</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {selectedSubmission && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ThemedText type="title">{selectedSubmission.title}</ThemedText>
              <ThemedText type="subtitle">Customer Info</ThemedText>
              <ThemedText>Name: {selectedSubmission.customerInfo.name}</ThemedText>
              <ThemedText>Address: {selectedSubmission.customerInfo.address}</ThemedText>

              <ThemedText type="subtitle">Scores</ThemedText>
              <ThemedText>Score: {selectedSubmission.score} ({selectedSubmission.scoreValue}/100)</ThemedText>
              <ThemedText>Risk Score: {selectedSubmission.riskScore}</ThemedText>

              <ThemedText type="subtitle">Missing Data</ThemedText>
              {selectedSubmission.missingData.length > 0 ? (
                selectedSubmission.missingData.map((item, index) => (
                  <ThemedText key={index}>- {item}</ThemedText>
                ))
              ) : (
                <ThemedText>None</ThemedText>
              )}

              <ThemedText type="subtitle">Core Underwriting Metrics</ThemedText>
              <ThemedText>Revenue: {selectedSubmission.underwritingMetrics.revenue}</ThemedText>
              <ThemedText>Employee Count: {selectedSubmission.underwritingMetrics.employeeCount}</ThemedText>
              <ThemedText>Claims History: {selectedSubmission.underwritingMetrics.claimsHistory}</ThemedText>

              <ThemedText type="subtitle">Underwriting Reasoning</ThemedText>
              <ThemedText>{selectedSubmission.reasoning}</ThemedText>

              <Button title="Close" onPress={closeModal} />
            </View>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 16,
    color: '#666',
  },
  listContainer: {
    flex: 1,
  },
  submissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submissionDetails: {
    flex: 1,
  },
  scoreContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  winnabilityScore: {
    backgroundColor: '#007bff',
  },
  safeScore: {
    backgroundColor: '#28a745',
  },
  notSafeScore: {
    backgroundColor: '#dc3545',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
});

