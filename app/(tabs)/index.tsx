import React, { useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";



interface Values {
  min: number;
  targetMin: number;
  targetMax: number;
  max: number;
}

export default function RangeWithToggles() {
  const [useMin, setUseMin] = useState<boolean>(true);
  const [useTargetMin, setUseTargetMin] = useState<boolean>(true);
  const [useTargetMax, setUseTargetMax] = useState<boolean>(true);
  const [useMax, setUseMax] = useState<boolean>(true);

  const [values, setValues] = useState<Values>({
    min: 50_000,
    targetMin: 75_000,
    targetMax: 100_000,
    max: 175_000,
  });

  const activeTracks: (keyof Values)[] = [];
  if (useMin) activeTracks.push('min');
  if (useTargetMin) activeTracks.push('targetMin');
  if (useTargetMax) activeTracks.push('targetMax');
  if (useMax) activeTracks.push('max');

  const sliderValues = activeTracks.map(track => values[track]);

  const handleSliderChange = (newValues: number | number[]) => {
    const newSliderValues: Partial<Values> = {};
    const valuesArray = Array.isArray(newValues) ? newValues : [newValues];
    valuesArray.forEach((value, index) => {
      const trackName = activeTracks[index];
      if (trackName) {
        newSliderValues[trackName] = value;
      }
    });
    setValues(prev => ({ ...prev, ...newSliderValues }));
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <h3>Configurable Guideline Slider</h3>

      <label style={{ marginRight: 10 }}>
        <input
          type="checkbox"
          checked={useMin}
          onChange={(e) => setUseMin(e.target.checked)}
        />{" "}
        Enable Min
      </label>
      <label style={{ marginRight: 10 }}>
        <input
          type="checkbox"
          checked={useTargetMin}
          onChange={(e) => setUseTargetMin(e.target.checked)}
        />{" "}
        Enable Target Min
      </label>
      <label style={{ marginRight: 10 }}>
        <input
          type="checkbox"
          checked={useTargetMax}
          onChange={(e) => setUseTargetMax(e.target.checked)}
        />{" "}
        Enable Target Max
      </label>
      <label>
        <input
          type="checkbox"
          checked={useMax}
          onChange={(e) => setUseMax(e.target.checked)}
        />{" "}
        Enable Max
      </label>

      <div style={{ margin: "2rem 0" }}>
        {sliderValues.length > 1 && (
          <Slider
            range
            min={0}
            max={200_000}
            step={1000}
            value={sliderValues}
            onChange={handleSliderChange}
            allowCross={false}
          />
        )}
        {sliderValues.length === 1 && (
          <Slider
            min={0}
            max={200_000}
            step={1000}
            value={sliderValues[0]}
            onChange={handleSliderChange}
          />
        )}
      </div>

      <pre>{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}
