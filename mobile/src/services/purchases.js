import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';

export const TEACHER_ENTITLEMENT_ID = 'teacher_access';

let configured = false;

export function configurePurchases(appUserId) {
    const apiKey = Platform.OS === 'android' ? ANDROID_KEY : IOS_KEY;
    if (!apiKey) {
        console.log('RevenueCat API anahtarı tanımlı değil, satın alma özelliği devre dışı.');
        return;
    }
    if (!configured) {
        Purchases.configure({ apiKey, appUserID: appUserId });
        configured = true;
    } else {
        Purchases.logIn(appUserId);
    }
}

export async function getTeacherOffering() {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
}

export async function purchaseTeacherPackage(pkg) {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isTeacherEntitlementActive(customerInfo);
}

export async function restorePurchases() {
    const customerInfo = await Purchases.restorePurchases();
    return isTeacherEntitlementActive(customerInfo);
}

export function isTeacherEntitlementActive(customerInfo) {
    return Boolean(customerInfo?.entitlements?.active?.[TEACHER_ENTITLEMENT_ID]);
}

export async function logOutPurchases() {
    if (configured) {
        try {
            await Purchases.logOut();
        } catch {
            configured = false;
        }
    }
}
