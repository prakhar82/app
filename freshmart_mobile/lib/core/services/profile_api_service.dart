import '../models/models.dart';
import 'api_client.dart';

class ProfileApiService {
  ProfileApiService(this._client);

  final ApiClient _client;

  Future<UserProfile> fetchProfile() async {
    final response = await _client.dio.get('/identity/me');
    return UserProfile.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserProfile> updateProfile({
    required String? name,
    required String? phone,
    required String? preferredLanguage,
    int? defaultAddressId,
  }) async {
    final response = await _client.dio.patch('/identity/me', data: {
      'name': name,
      'phone': phone,
      'preferredLanguage': preferredLanguage,
      'defaultAddressId': defaultAddressId,
    });
    return UserProfile.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<Address>> fetchAddresses() async {
    final response = await _client.dio.get('/identity/me/addresses');
    return (response.data as List).map((e) => Address.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createAddress(Address address) async {
    await _client.dio.post('/identity/me/addresses', data: address.toJson());
  }

  Future<void> updateAddress(Address address) async {
    await _client.dio.put('/identity/me/addresses/${address.id}', data: address.toJson());
  }

  Future<void> deleteAddress(int id) async {
    await _client.dio.delete('/identity/me/addresses/$id');
  }

  Future<void> setDefaultAddress(int id) async {
    await _client.dio.post('/identity/me/addresses/$id/default');
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _client.dio.post('/identity/me/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }
}
