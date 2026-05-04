import { NativeModule, requireNativeModule } from 'expo';
import type { SignalInfo } from './Telephony.types';

declare class TelephonyModule extends NativeModule {
  getSignalInfo(): SignalInfo;
}

export default requireNativeModule<TelephonyModule>('Telephony');
