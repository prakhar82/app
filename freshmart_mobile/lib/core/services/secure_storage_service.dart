import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/models.dart';

class SecureStorageService {
  static const _sessionKey = 'freshmart_session';
  static const _biometricEnabledKey = 'freshmart_biometric_enabled';

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> saveSession(AuthSession session) async {
    await _storage.write(key: _sessionKey, value: jsonEncode(session.toJson()));
  }

  Future<AuthSession?> readSession() async {
    final value = await _storage.read(key: _sessionKey);
    if (value == null || value.isEmpty) {
      return null;
    }
    return AuthSession.fromJson(jsonDecode(value) as Map<String, dynamic>);
  }

  Future<String?> readToken() async => (await readSession())?.accessToken;

  Future<void> clearSession() async {
    await _storage.delete(key: _sessionKey);
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(key: _biometricEnabledKey, value: enabled ? '1' : '0');
  }

  Future<bool> isBiometricEnabled() async => (await _storage.read(key: _biometricEnabledKey)) == '1';
}
