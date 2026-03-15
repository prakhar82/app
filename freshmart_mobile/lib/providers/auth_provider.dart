import 'package:flutter/foundation.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

import '../core/models/models.dart';
import '../core/services/auth_api_service.dart';
import '../core/services/biometric_service.dart';
import '../core/services/secure_storage_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({
    required AuthApiService authApi,
    required SecureStorageService storage,
    required BiometricService biometricService,
  })  : _authApi = authApi,
        _storage = storage,
        _biometricService = biometricService;

  final AuthApiService _authApi;
  final SecureStorageService _storage;
  final BiometricService _biometricService;

  AuthSession? _session;
  bool _bootstrapping = true;

  bool get isAuthenticated => _session != null;
  bool get isBootstrapping => _bootstrapping;
  String? get email => _session?.email;
  bool get isAdmin => _session?.role.toUpperCase() == 'ADMIN';

  Future<void> bootstrap() async {
    final stored = await _storage.readSession();
    if (stored != null && !JwtDecoder.isExpired(stored.accessToken)) {
      final biometricEnabled = await _storage.isBiometricEnabled();
      if (biometricEnabled) {
        final allowed = await _biometricService.authenticate();
        if (allowed) {
          _session = stored;
        }
      } else {
        _session = stored;
      }
    }
    _bootstrapping = false;
    notifyListeners();
  }

  Future<void> login({
    required String email,
    required String password,
    bool enableBiometric = false,
  }) async {
    final session = await _authApi.login(email: email, password: password);
    _session = session;
    await _storage.saveSession(session);
    await _storage.setBiometricEnabled(enableBiometric);
    notifyListeners();
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) =>
      _authApi.register(email: email, password: password, name: name, phone: phone);

  Future<void> forgotPassword(String email) => _authApi.forgotPassword(email);

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) =>
      _authApi.resetPassword(email: email, code: code, newPassword: newPassword);

  Future<bool> canUseBiometric() => _biometricService.canUseBiometrics();

  Future<void> logout() async {
    _session = null;
    await _storage.clearSession();
    await _storage.setBiometricEnabled(false);
    notifyListeners();
  }
}
