import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useThemeColor } from '@/hooks/use-theme-color';

// Define interfaces for better type safety
interface Customer {
  id: string;
  name: string;
  email: string;
  // Add other customer-related fields as needed
}

interface Policy {
  id: string;
  policyNumber: string;
  type: string; // e.g., 'Auto', 'Home', 'Life'
  premium: number;
  customerId: string;
  startDate: string;
  endDate: string;
  // Add other policy-related fields as needed
}

export default function PortfolioDashboardScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Customers
        const customersCollectionRef = collection(db, 'customers');
        const customerSnapshot = await getDocs(customersCollectionRef);
        const customersList = customerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Customer[];
        setCustomers(customersList);

        // Fetch Policies
        const policiesCollectionRef = collection(db, 'policies');
        const policySnapshot = await getDocs(policiesCollectionRef);
        const policiesList = policySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Policy[];
        setPolicies(policiesList);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Data Processing ---
  const totalCustomers = customers.length;
  const totalPolicies = policies.length;
  const totalPremium = policies.reduce((sum, policy) => sum + policy.premium, 0);

  const policiesByType: { [key: string]: number } = policies.reduce((acc, policy) => {
    acc[policy.type] = (acc[policy.type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText>Loading dashboard data...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText type="title" style={{ color: 'red' }}>Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <ThemedText type="title" style={styles.title}>Portfolio Dashboard</ThemedText>

        {/* Key Metrics */}
        <ThemedView style={styles.metricCard}>
          <ThemedText type="subtitle">Total Customers</ThemedText>
          <ThemedText type="title">{totalCustomers}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.metricCard}>
          <ThemedText type="subtitle">Total Policies</ThemedText>
          <ThemedText type="title">{totalPolicies}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.metricCard}>
          <ThemedText type="subtitle">Total Annual Premium</ThemedText>
          <ThemedText type="title">${totalPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ThemedText>
        </ThemedView>

        {/* Policies by Type Chart */}
        <ThemedText type="subtitle" style={styles.chartTitle}>Policies by Type</ThemedText>
        <ThemedView style={styles.chartContainer}>
          {Object.entries(policiesByType).map(([type, count]) => (
            <View key={type} style={styles.chartBarWrapper}>
              <View style={[styles.chartBar, { width: `${(count / totalPolicies) * 100}%`, backgroundColor: getColorForPolicyType(type) }]} />
              <ThemedText style={styles.chartLabel}>{type}: {count}</ThemedText>
            </View>
          ))}
        </ThemedView>

        {/* You can add more cards for other metrics or charts here */}

      </ScrollView>
    </ThemedView>
  );
}

// Helper function to assign colors to policy types for visualization
const getColorForPolicyType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'auto':
      return '#4CAF50'; // Green
    case 'home':
      return '#2196F3'; // Blue
    case 'life':
      return '#FFC107'; // Amber
    case 'health':
      return '#FF5722'; // Deep Orange
    default:
      return '#9E9E9E'; // Grey
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  metricCard: {
    backgroundColor: '#f0f0f0', // Light grey for cards
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartBar: {
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  chartLabel: {
    fontSize: 16,
  },
});