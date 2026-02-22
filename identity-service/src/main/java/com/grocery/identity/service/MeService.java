package com.grocery.identity.service;

import com.grocery.common.api.DomainException;
import com.grocery.identity.domain.UserAccount;
import com.grocery.identity.dto.MeResponse;
import com.grocery.identity.dto.UpdateMeRequest;
import com.grocery.identity.repo.UserAccountRepository;
import com.grocery.identity.repo.UserAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MeService {
    private final UserAccountRepository userAccountRepository;
    private final UserAddressRepository userAddressRepository;
    private final AddressService addressService;

    public MeService(UserAccountRepository userAccountRepository,
                     UserAddressRepository userAddressRepository,
                     AddressService addressService) {
        this.userAccountRepository = userAccountRepository;
        this.userAddressRepository = userAddressRepository;
        this.addressService = addressService;
    }

    @Transactional(readOnly = true)
    public MeResponse get(String email) {
        UserAccount user = requireUser(email);
        return toResponse(user);
    }

    @Transactional
    public MeResponse update(String email, UpdateMeRequest request) {
        UserAccount user = requireUser(email);
        user.setName(request.name());
        user.setPhone(request.phone());
        user.setPreferredLanguage(request.preferredLanguage());
        if (request.defaultAddressId() != null) {
            var address = userAddressRepository.findByIdAndUserId(request.defaultAddressId(), user.getId())
                    .orElseThrow(() -> new DomainException("NOT_FOUND", "Address not found"));
            addressService.setDefault(email, address.getId());
            user = requireUser(email);
        } else {
            user = userAccountRepository.save(user);
        }
        return toResponse(user);
    }

    private UserAccount requireUser(String email) {
        return userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new DomainException("UNAUTHORIZED", "Unknown user"));
    }

    private MeResponse toResponse(UserAccount user) {
        return new MeResponse(
                user.getEmail(),
                user.getName(),
                user.getPhone(),
                user.getPreferredLanguage(),
                user.getDefaultAddress() == null ? null : user.getDefaultAddress().getId(),
                user.getRole(),
                user.getStatus()
        );
    }
}
