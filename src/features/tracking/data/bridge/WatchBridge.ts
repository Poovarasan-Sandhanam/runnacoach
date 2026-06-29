import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

export interface IWatchBridge {
  isWatchSupported(): Promise<boolean>;
  isWatchAppInstalled(): Promise<boolean>;
  isWatchReachable(): Promise<boolean>;
  sendMessageToWatch(message: Record<string, any>): Promise<Record<string, any>>;
  transferUserInfo(data: Record<string, any>): Promise<void>;
}

const MockNativeWatchModule: IWatchBridge = {
  isWatchSupported: async () => Platform.OS === 'ios',
  isWatchAppInstalled: async () => true,
  isWatchReachable: async () => true,
  sendMessageToWatch: async (msg) => ({ status: 'delivered', ...msg }),
  transferUserInfo: async () => {}
};

const RNWatchModule = NativeModules.RNWatchBridge || MockNativeWatchModule;

const watchEventEmitter = NativeModules.RNWatchBridge 
  ? new NativeEventEmitter(NativeModules.RNWatchBridge) 
  : null;

export class WatchBridge {
  static async isSupported(): Promise<boolean> {
    return await RNWatchModule.isWatchSupported();
  }

  static async isAppInstalled(): Promise<boolean> {
    return await RNWatchModule.isWatchAppInstalled();
  }

  static async sendAlert(action: 'START' | 'STOP' | 'PACE_WARNING', payload: Record<string, any>): Promise<Record<string, any>> {
    return await RNWatchModule.sendMessageToWatch({
      action,
      payload,
      timestamp: Date.now()
    });
  }

  static async syncWorkoutPlan(workouts: any[]): Promise<void> {
    await RNWatchModule.transferUserInfo({
      dataType: 'WORKOUT_PLAN',
      payload: workouts,
      timestamp: Date.now()
    });
  }

  static addWatchListener(eventName: 'onWatchRunStart' | 'onWatchRunEnd' | 'onWatchStatsUpdate', callback: (data: any) => void) {
    if (!watchEventEmitter) {
      return { remove: () => {} };
    }
    return watchEventEmitter.addListener(eventName, callback);
  }
}
