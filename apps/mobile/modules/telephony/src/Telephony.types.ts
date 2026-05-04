export type SignalInfo = {
  signalDbm: number | null;
  rsrp: number | null;
  rsrq: number | null;
  networkType: '5G' | '4G' | '3G' | '2G' | 'none' | 'unknown';
  mcc: string | null;
  mnc: string | null;
  operatorName: string | null;
  roaming: boolean;
  androidVersion: number;
};
