import '../models/models.dart';
import 'api_client.dart';

class AuthApiService {
  AuthApiService(this._client);

  final ApiClient _client;

  Future<AuthSession> login({required String email, required String password}) async {
    final response = await _client.dio.post('/identity/auth/login', data: {'email': email, 'password': password});
    return AuthSession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    await _client.dio.post('/identity/auth/register', data: {
      'email': email,
      'password': password,
      'name': name,
      'phone': phone,
    });
  }

  Future<void> forgotPassword(String email) async {
    await _client.dio.post('/identity/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    await _client.dio.post('/identity/auth/reset-password', data: {
      'email': email,
      'code': code,
      'newPassword': newPassword,
    });
  }
}
