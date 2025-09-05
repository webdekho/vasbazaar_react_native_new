//
//  PayUUpiModule.m
//  VasBazaar
//
//  PayU UPI SDK iOS Native Module Implementation
//

#import "PayUUpiModule.h"
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

@implementation PayUUpiModule

// Export module to React Native
RCT_EXPORT_MODULE();

// Module requires main queue setup
+ (BOOL)requiresMainQueueSetup {
    return YES;
}

// Export constants to JavaScript
- (NSDictionary *)constantsToExport {
    return @{
        @"ENVIRONMENT_TEST": @"test",
        @"ENVIRONMENT_PRODUCTION": @"production",
        @"PAYMENT_STATUS_SUCCESS": @"success",
        @"PAYMENT_STATUS_FAILURE": @"failure",
        @"PAYMENT_STATUS_PENDING": @"pending"
    };
}

/**
 * Initialize PayU UPI SDK with merchant configuration
 */
RCT_EXPORT_METHOD(initialize:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"Initializing PayU UPI SDK on iOS");
    
    @try {
        // Store configuration (in production, initialize actual PayU SDK)
        NSString *merchantKey = config[@"merchantKey"];
        NSString *salt = config[@"salt"];
        NSString *environment = config[@"environment"];
        
        if (!merchantKey || !salt) {
            reject(@"INVALID_CONFIG", @"Merchant key and salt are required", nil);
            return;
        }
        
        // TODO: Initialize actual PayU UPI SDK for iOS
        // [PayUUpiSDK initializeWithMerchantKey:merchantKey salt:salt environment:environment];
        
        NSDictionary *result = @{
            @"success": @YES,
            @"message": @"PayU UPI SDK initialized successfully (iOS simulation)"
        };
        
        resolve(result);
        
    } @catch (NSException *exception) {
        reject(@"INIT_ERROR", [NSString stringWithFormat:@"Failed to initialize PayU UPI SDK: %@", exception.reason], nil);
    }
}

/**
 * Validate UPI VPA (Virtual Payment Address)
 */
RCT_EXPORT_METHOD(validateVpa:(NSString *)vpa
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"Validating VPA on iOS: %@", vpa);
    
    @try {
        // Basic VPA format validation
        BOOL isValid = [self isValidVpaFormat:vpa];
        
        // TODO: Use actual PayU VPA validation for iOS
        // BOOL isValid = [PayUUpiSDK validateVpa:vpa];
        
        NSDictionary *result = @{
            @"success": @YES,
            @"valid": @(isValid),
            @"message": isValid ? @"VPA is valid" : @"Invalid VPA format"
        };
        
        resolve(result);
        
    } @catch (NSException *exception) {
        reject(@"VPA_ERROR", [NSString stringWithFormat:@"VPA validation failed: %@", exception.reason], nil);
    }
}

/**
 * Make UPI Collect payment
 */
RCT_EXPORT_METHOD(makeUpiCollectPayment:(NSDictionary *)paymentParams
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"Making UPI Collect payment on iOS");
    
    @try {
        // TODO: Use actual PayU UPI SDK for collect payment
        // [PayUUpiSDK makeCollectPayment:paymentParams completion:^(NSDictionary *result) {
        //     resolve(result);
        // }];
        
        // Simulate collect payment for testing
        [self simulatePaymentWithType:@"collect" 
                           parameters:paymentParams 
                             resolver:resolve 
                             rejecter:reject];
        
    } @catch (NSException *exception) {
        reject(@"PAYMENT_ERROR", [NSString stringWithFormat:@"UPI Collect payment failed: %@", exception.reason], nil);
    }
}

/**
 * Make UPI Intent payment (iOS has limited UPI support)
 */
RCT_EXPORT_METHOD(makeUpiIntentPayment:(NSDictionary *)paymentParams
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"UPI Intent payment requested on iOS");
    
    // UPI Intent is primarily an Android feature
    // On iOS, we would typically redirect to web-based payment or use app-specific schemes
    
    reject(@"PLATFORM_NOT_SUPPORTED", @"UPI Intent is not supported on iOS platform", nil);
}

/**
 * Make payment with specific UPI app
 */
RCT_EXPORT_METHOD(makeUpiAppPayment:(NSDictionary *)paymentParams
                  upiApp:(NSString *)upiApp
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    RCTLogInfo(@"Making UPI app payment on iOS with app: %@", upiApp);
    
    @try {
        // Check if specific UPI app is available on iOS
        NSString *appScheme = [self getUpiAppScheme:upiApp];
        
        if (!appScheme) {
            reject(@"UNSUPPORTED_APP", [NSString stringWithFormat:@"Unsupported UPI app on iOS: %@", upiApp], nil);
            return;
        }
        
        // Check if app can be opened
        NSURL *appURL = [NSURL URLWithString:appScheme];
        if (![[UIApplication sharedApplication] canOpenURL:appURL]) {
            reject(@"APP_NOT_AVAILABLE", [NSString stringWithFormat:@"UPI app not available on iOS: %@", upiApp], nil);
            return;
        }
        
        // TODO: Open specific UPI app with payment parameters
        // This would require app-specific URL schemes and parameter formatting
        
        // For now, simulate the payment
        [self simulatePaymentWithType:[NSString stringWithFormat:@"%@_app", upiApp]
                           parameters:paymentParams
                             resolver:resolve
                             rejecter:reject];
        
    } @catch (NSException *exception) {
        reject(@"APP_PAYMENT_ERROR", [NSString stringWithFormat:@"UPI app payment failed: %@", exception.reason], nil);
    }
}

/**
 * Get list of available UPI apps on iOS device
 */
RCT_EXPORT_METHOD(getAvailableUpiApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        NSMutableArray *availableApps = [[NSMutableArray alloc] init];
        
        // List of UPI apps that might be available on iOS
        NSDictionary *upiApps = @{
            @"PhonePe": @"phonepe://",
            @"Google Pay": @"gpay://",
            @"Paytm": @"paytm://",
            @"WhatsApp": @"whatsapp://"
        };
        
        // Check which apps are installed
        for (NSString *appName in upiApps.allKeys) {
            NSString *scheme = upiApps[appName];
            NSURL *appURL = [NSURL URLWithString:scheme];
            BOOL isAvailable = [[UIApplication sharedApplication] canOpenURL:appURL];
            
            NSDictionary *appInfo = @{
                @"name": appName,
                @"scheme": scheme,
                @"available": @(isAvailable)
            };
            
            [availableApps addObject:appInfo];
        }
        
        resolve(availableApps);
        
    } @catch (NSException *exception) {
        reject(@"APPS_ERROR", [NSString stringWithFormat:@"Failed to get available UPI apps: %@", exception.reason], nil);
    }
}

#pragma mark - Helper Methods

- (BOOL)isValidVpaFormat:(NSString *)vpa {
    if (!vpa || vpa.length == 0) {
        return NO;
    }
    
    // Basic VPA format validation: contains @ and has valid characters
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$" 
                                                                           options:0 
                                                                             error:nil];
    NSUInteger numberOfMatches = [regex numberOfMatchesInString:vpa 
                                                        options:0 
                                                          range:NSMakeRange(0, vpa.length)];
    
    return numberOfMatches > 0;
}

- (NSString *)getUpiAppScheme:(NSString *)upiApp {
    NSDictionary *appSchemes = @{
        @"phonepe": @"phonepe://",
        @"googlepay": @"gpay://",
        @"gpay": @"gpay://",
        @"paytm": @"paytm://",
        @"whatsapp": @"whatsapp://"
    };
    
    return appSchemes[upiApp.lowercaseString];
}

- (void)simulatePaymentWithType:(NSString *)paymentType
                     parameters:(NSDictionary *)parameters
                       resolver:(RCTPromiseResolveBlock)resolve
                       rejecter:(RCTPromiseRejectBlock)reject {
    
    // Simulate payment processing with delay
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        
        // Simulate random success/failure (70% success rate)
        BOOL isSuccess = (arc4random_uniform(10) < 7);
        
        NSDictionary *result = @{
            @"success": @YES,
            @"status": isSuccess ? @"success" : @"failure",
            @"message": isSuccess ? 
                [NSString stringWithFormat:@"%@ payment completed successfully (iOS simulation)", paymentType] :
                [NSString stringWithFormat:@"%@ payment failed (iOS simulation)", paymentType],
            @"txnid": parameters[@"txnid"] ?: @"",
            @"type": paymentType
        };
        
        resolve(result);
    });
}

@end