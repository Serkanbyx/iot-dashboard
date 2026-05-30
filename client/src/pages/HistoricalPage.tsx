import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import * as sensorService from "../api/sensorService";
import * as thresholdService from "../api/thresholdService";
import type {
  SensorInfo,
  ThresholdConfig,
  SensorTypeValue,
  AggregatedReading,
} from "../types";
import FilterBar from "../components/historical/FilterBar";
import HistoricalChart from "../components/historical/HistoricalChart";
import StatsSummary from "../components/historical/StatsSummary";
import type { DateRange } from "../components/historical/DateRangePicker";

type AggregationWindow = "minute" | "hour";

const DAY = 1000 * 60 * 60 * 24;
const MAX_RANGE_MS = DAY * 7;

function getDefaultRange(): DateRange {
  const now = Date.now();
  return {
    start: new Date(now - DAY).toISOString(),
    stop: new Date(now).toISOString(),
  };
}

export default function HistoricalPage() {
  const [sensors, setSensors] = useState<SensorInfo[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [selectedType, setSelectedType] = useState<SensorTypeValue>(
    "temperature"
  );
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [window, setWindow] = useState<AggregationWindow>("minute");
  const [data, setData] = useState<AggregatedReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch sensor list + thresholds on mount
  useEffect(() => {
    async function fetchMeta() {
      try {
        const [sensorRes, thresholdRes] = await Promise.all([
          sensorService.getSensorList(),
          thresholdService.getAllThresholds(),
        ]);
        setSensors(sensorRes.sensors);
        setThresholds(thresholdRes.thresholds);
        if (sensorRes.sensors.length > 0) {
          setSelectedSensor(sensorRes.sensors[0].sensorId);
        }
      } catch {
        toast.error("Failed to load sensor list.");
      }
    }

    fetchMeta();
  }, []);

  const rangeError = useMemo(() => {
    if (!dateRange.start || !dateRange.stop) return "Select a start and end.";
    const start = new Date(dateRange.start).getTime();
    const stop = new Date(dateRange.stop).getTime();
    if (stop <= start) return "End must be after start.";
    if (stop - start > MAX_RANGE_MS) return "Range cannot exceed 7 days.";
    return undefined;
  }, [dateRange]);

  const activeThreshold = useMemo(
    () =>
      thresholds.find((t) => t.sensorType.toLowerCase() === selectedType),
    [thresholds, selectedType]
  );

  const handleLoad = useCallback(async () => {
    if (!selectedSensor || rangeError) return;

    setLoading(true);
    try {
      const res = await sensorService.getAggregatedData({
        sensorId: selectedSensor,
        type: selectedType,
        start: dateRange.start,
        stop: dateRange.stop,
        window,
      });
      setData(res.data);
      setHasLoaded(true);
      if (res.data.length === 0) {
        toast("No data found for the selected range.");
      }
    } catch {
      toast.error("Failed to load historical data.");
    } finally {
      setLoading(false);
    }
  }, [selectedSensor, selectedType, dateRange, window, rangeError]);

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Historical Data</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Explore past sensor data
        </p>
      </div>

      {/* Filter bar */}
      <FilterBar
        sensors={sensors}
        selectedSensor={selectedSensor}
        selectedType={selectedType}
        dateRange={dateRange}
        window={window}
        loading={loading}
        rangeError={rangeError}
        onSensorChange={setSelectedSensor}
        onTypeChange={setSelectedType}
        onDateRangeChange={setDateRange}
        onWindowChange={setWindow}
        onLoad={handleLoad}
      />

      {/* Chart + stats */}
      {hasLoaded || loading ? (
        <>
          <HistoricalChart
            data={data}
            threshold={activeThreshold}
            sensorType={selectedType}
            loading={loading}
          />
          {data.length > 0 && (
            <StatsSummary data={data} unit={activeThreshold?.unit ?? ""} />
          )}
        </>
      ) : (
        <div className="glass rounded-xl p-4 min-h-[400px] flex items-center justify-center">
          <p className="text-sm text-text-muted">
            Select filters and load data to see the chart.
          </p>
        </div>
      )}
    </div>
  );
}
