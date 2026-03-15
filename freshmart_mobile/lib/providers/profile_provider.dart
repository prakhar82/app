import 'package:flutter/foundation.dart';

import '../core/models/models.dart';
import '../core/services/profile_api_service.dart';
import 'auth_provider.dart';

class ProfileProvider extends ChangeNotifier {
  ProfileProvider(this._profileApi, this._authProvider);

  final ProfileApiService _profileApi;
  final AuthProvider _authProvider;

  UserProfile? profile;
  List<Address> addresses = [];
  bool loading = false;

  Future<void> load() async {
    if (!_authProvider.isAuthenticated) {
      profile = null;
      addresses = [];
      notifyListeners();
      return;
    }
    loading = true;
    notifyListeners();
    try {
      profile = await _profileApi.fetchProfile();
      addresses = await _profileApi.fetchAddresses();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> saveProfile({
    required String? name,
    required String? phone,
    required String? preferredLanguage,
    int? defaultAddressId,
  }) async {
    profile = await _profileApi.updateProfile(
      name: name,
      phone: phone,
      preferredLanguage: preferredLanguage,
      defaultAddressId: defaultAddressId,
    );
    addresses = await _profileApi.fetchAddresses();
    notifyListeners();
  }

  Future<void> saveAddress(Address address) async {
    if (address.id == null) {
      await _profileApi.createAddress(address);
    } else {
      await _profileApi.updateAddress(address);
    }
    addresses = await _profileApi.fetchAddresses();
    notifyListeners();
  }

  Future<void> deleteAddress(int id) async {
    await _profileApi.deleteAddress(id);
    addresses = await _profileApi.fetchAddresses();
    notifyListeners();
  }

  Future<void> setDefault(int id) async {
    await _profileApi.setDefaultAddress(id);
    await load();
  }

  Future<void> changePassword({required String currentPassword, required String newPassword}) {
    return _profileApi.changePassword(currentPassword: currentPassword, newPassword: newPassword);
  }
}
