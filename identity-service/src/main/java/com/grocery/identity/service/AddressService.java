package com.grocery.identity.service;

import com.grocery.common.api.DomainException;
import com.grocery.identity.domain.UserAccount;
import com.grocery.identity.domain.UserAddress;
import com.grocery.identity.dto.AddressResponse;
import com.grocery.identity.dto.AddressUpsertRequest;
import com.grocery.identity.repo.UserAccountRepository;
import com.grocery.identity.repo.UserAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {
    private final UserAccountRepository userAccountRepository;
    private final UserAddressRepository userAddressRepository;
    private final PostcodeValidationService postcodeValidationService;

    public AddressService(UserAccountRepository userAccountRepository,
                          UserAddressRepository userAddressRepository,
                          PostcodeValidationService postcodeValidationService) {
        this.userAccountRepository = userAccountRepository;
        this.userAddressRepository = userAddressRepository;
        this.postcodeValidationService = postcodeValidationService;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> list(String email) {
        UserAccount user = requireUser(email);
        return userAddressRepository.findByUserIdOrderByIdDesc(user.getId()).stream().map(AddressResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AddressResponse getOne(String email, Long addressId) {
        UserAccount user = requireUser(email);
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new DomainException("NOT_FOUND", "Address not found"));
        return AddressResponse.from(address);
    }

    @Transactional
    public AddressResponse create(String email, AddressUpsertRequest request) {
        UserAccount user = requireUser(email);
        validatePostcode(request.postcode(), request.country());
        if (request.isDefault()) {
            clearDefault(user.getId());
        }
        UserAddress address = toEntity(new UserAddress(), user, request);
        address = userAddressRepository.save(address);
        if (request.isDefault()) {
            user.setDefaultAddress(address);
            userAccountRepository.save(user);
        }
        return AddressResponse.from(address);
    }

    @Transactional
    public AddressResponse update(String email, Long addressId, AddressUpsertRequest request) {
        UserAccount user = requireUser(email);
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new DomainException("NOT_FOUND", "Address not found"));
        validatePostcode(request.postcode(), request.country());
        if (request.isDefault()) {
            clearDefault(user.getId());
        }
        address = toEntity(address, user, request);
        address = userAddressRepository.save(address);
        if (request.isDefault()) {
            user.setDefaultAddress(address);
            userAccountRepository.save(user);
        }
        return AddressResponse.from(address);
    }

    @Transactional
    public void delete(String email, Long addressId) {
        UserAccount user = requireUser(email);
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new DomainException("NOT_FOUND", "Address not found"));
        if (user.getDefaultAddress() != null && user.getDefaultAddress().getId().equals(addressId)) {
            throw new DomainException("DEFAULT_ADDRESS_DELETE_BLOCKED", "Set another default address before deleting this one");
        }
        userAddressRepository.delete(address);
    }

    @Transactional
    public void setDefault(String email, Long addressId) {
        UserAccount user = requireUser(email);
        UserAddress address = userAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new DomainException("NOT_FOUND", "Address not found"));
        clearDefault(user.getId());
        address.setDefault(true);
        userAddressRepository.save(address);
        user.setDefaultAddress(address);
        userAccountRepository.save(user);
    }

    private UserAddress toEntity(UserAddress address, UserAccount user, AddressUpsertRequest request) {
        address.setUser(user);
        address.setLabel(request.label());
        address.setLine1(request.line1().trim());
        address.setLine2(request.line2());
        address.setCity(request.city().trim());
        address.setPostcode(postcodeValidationService.normalize(request.postcode()));
        address.setCountry(request.country().trim().toUpperCase());
        address.setDefault(request.isDefault());
        return address;
    }

    private void clearDefault(Long userId) {
        List<UserAddress> addresses = userAddressRepository.findByUserIdOrderByIdDesc(userId);
        for (UserAddress a : addresses) {
            if (a.isDefault()) {
                a.setDefault(false);
                userAddressRepository.save(a);
            }
        }
    }

    private void validatePostcode(String postcode, String country) {
        var resp = postcodeValidationService.validate(postcode, country);
        if (!resp.allowed()) {
            throw new DomainException("POSTCODE_NOT_ALLOWED", resp.reason());
        }
    }

    private UserAccount requireUser(String email) {
        return userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new DomainException("UNAUTHORIZED", "Unknown user"));
    }
}
