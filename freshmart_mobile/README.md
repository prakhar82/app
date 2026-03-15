# FreshMart Mobile

Flutter client for the existing FreshMart backend.

Backend base URL:

```text
http://52.249.217.147:8080/api
```

## Stack

- Flutter 3+
- `dio`
- `provider`
- `flutter_secure_storage`
- `local_auth`
- `webview_flutter`
- `webview_windows`

## Features

- Login / register / forgot password / reset password
- JWT token storage
- Auto login from secure storage
- Biometric unlock for saved session
- Product catalog and product detail
- Product reviews with star ratings
- Cart management
- Checkout with COD or iDEAL
- Stripe checkout redirect handling in WebView
- Order history and order detail
- User profile, addresses, and change password

## Create platform folders

If this folder does not yet have native platform scaffolding, run:

```bash
flutter create . --platforms=android,ios,windows
```

Then fetch packages:

```bash
flutter pub get
```

## Run

```bash
flutter run -d windows
flutter run -d android
flutter run -d ios
```

## Notes

- Android must allow cleartext traffic. After `flutter create .`, update:

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application
    android:label="freshmart_mobile"
    android:name="${applicationName}"
    android:icon="@mipmap/ic_launcher"
    android:usesCleartextTraffic="true">
```

- iOS must allow HTTP traffic. After `flutter create .`, add to `ios/Runner/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

- The app uses the existing REST APIs only. No backend code is created or required.
- Payment success/cancel is detected from the existing checkout return URL and then confirmed via the order API.
