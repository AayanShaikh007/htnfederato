import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TextInput, Button, StyleSheet } from "react-native";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface NumericValues {
  min?: number;
  targetMin?: number;
  targetMax?: number;
  max?: number;
}

export default function GuidelinesDashboard() {
  // Firestore-backed state
  const [totalPremium, setTotalPremium] = useState<NumericValues>({});
  const [tivLimits, setTivLimits] = useState<NumericValues>({});
  const [lossValue, setLossValue] = useState<NumericValues>({});
  const [buildingAge, setBuildingAge] = useState<NumericValues>({});

  const [submissionType, setSubmissionType] = useState<string>("New businesses only");
  const [lineOfBusiness, setLineOfBusiness] = useState<string>("Property Line of Business");
  const [constructionType, setConstructionType] = useState<string>(
    "JM, Non Combustible/Steel, Masonry Non Combustible"
  );

  const [primaryRiskState, setPrimaryRiskState] = useState<Record<string, string>>({
    acceptable: "OH, PA, MD, CO, CA, FL, NC, SC, GA, VA, UT",
    target: "OH, PA, MD, CO, CA, FL",
    notAcceptable: "All other states"
  });

  const primaryRiskStateLabels: Record<string, string> = {
    acceptable: "Acceptable States",
    target: "Target States",
    notAcceptable: "Not Acceptable States"
  };

  // Load data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "guidelines", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTotalPremium(data.totalPremium || {});
        setTivLimits(data.tivLimits || {});
        setLossValue(data.lossValue || {});
        setBuildingAge(data.buildingAge || {});
        setSubmissionType(data.submissionType || "New businesses only");
        setLineOfBusiness(data.lineOfBusiness || "Property Line of Business");
        setConstructionType(
          data.constructionType ||
            "JM, Non Combustible/Steel, Masonry Non Combustible"
        );
        setPrimaryRiskState(data.primaryRiskState || primaryRiskState);
      }
    };
    fetchData();
  }, [primaryRiskState]);

  const saveToFirestore = async () => {
    await setDoc(doc(db, "guidelines", "config"), {
      totalPremium,
      tivLimits,
      lossValue,
      buildingAge,
      submissionType,
      lineOfBusiness,
      constructionType,
      primaryRiskState
    });
    alert("Saved to Firestore!");
  };

  const handleSliderChange = (
    newValues: number | number[],
    keys: (keyof NumericValues)[],
    state: NumericValues,
    setState: React.Dispatch<React.SetStateAction<NumericValues>>
  ) => {
    const valuesArray = Array.isArray(newValues) ? newValues : [newValues];
    const newState: NumericValues = { ...state };
    keys.forEach((key, index) => {
      newState[key] = valuesArray[index];
    });
    setState(newState);
  };

  const renderSliderCard = (
    title: string,
    values: NumericValues,
    setValues: React.Dispatch<React.SetStateAction<NumericValues>>,
    keys: (keyof NumericValues)[]
  ) => {
    const sliderValues = keys.map((key) => values[key] ?? 0);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={{ marginVertical: 12 }}>
          {sliderValues.length > 1 ? (
            <Slider
              range
              min={0}
              max={Math.max(...sliderValues) * 2 || 200_000}
              step={1000}
              value={sliderValues}
              onChange={(val) => handleSliderChange(val, keys, values, setValues)}
              allowCross={false}
            />
          ) : (
            <Slider
              min={0}
              max={(sliderValues[0] || 0) * 2 || 200_000}
              step={1000}
              value={sliderValues[0]}
              onChange={(val) => handleSliderChange(val, keys, values, setValues)}
            />
          )}
        </View>
        <Text>{JSON.stringify(values, null, 2)}</Text>
      </View>
    );
  };

  const renderTextCard = (
    title: string,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        style={styles.input}
      />
      <Text>{value}</Text>
    </View>
  );

  const renderMapCard = (
    title: string,
    values: Record<string, string>,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    labelsMap?: Record<string, string>
  ) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {Object.entries(values).map(([key, val]) => (
        <View key={key} style={{ marginBottom: 12 }}>
          <Text>{labelsMap?.[key] || key}</Text>
          <TextInput
            value={val}
            onChangeText={(text) =>
              setValues((prev) => ({ ...prev, [key]: text }))
            }
            style={styles.input}
          />
        </View>
      ))}
      <Text>{JSON.stringify(values, null, 2)}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {renderTextCard("Submission Type", submissionType, setSubmissionType)}
      {renderTextCard("Line of Business", lineOfBusiness, setLineOfBusiness)}
      {renderMapCard(
        "Primary Risk State",
        primaryRiskState,
        setPrimaryRiskState,
        primaryRiskStateLabels
      )}
      {renderSliderCard("TIV Limits", tivLimits, setTivLimits, [
        "min",
        "targetMin",
        "targetMax",
        "max"
      ])}
      {renderSliderCard("Total Premium", totalPremium, setTotalPremium, [
        "min",
        "targetMin",
        "targetMax",
        "max"
      ])}
      {renderSliderCard("Building Age", buildingAge, setBuildingAge, [
        "min",
        "targetMin",
        "max"
      ])}
      {renderTextCard(
        "Construction Type",
        constructionType,
        setConstructionType
      )}
      {renderSliderCard("Loss Value", lossValue, setLossValue, ["min", "max"])}

      <Button
        title="Save All Changes"
        onPress={saveToFirestore}
        color="#007bff"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginTop: 4
  }
});
