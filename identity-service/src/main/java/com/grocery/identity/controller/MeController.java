package com.grocery.identity.controller;

import com.grocery.common.api.DomainException;
import com.grocery.identity.dto.AddressResponse;
import com.grocery.identity.dto.AddressUpsertRequest;
import com.grocery.identity.dto.MeResponse;
import com.grocery.identity.dto.UpdateMeRequest;
import com.grocery.identity.service.AddressService;
import com.grocery.identity.service.MeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MeController {
    private final MeService meService;
    private final AddressService addressService;

    public MeController(MeService meService, AddressService addressService) {
        this.meService = meService;
        this.addressService = addressService;
    }

    @GetMapping("/me")
    public MeResponse me(@RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return meService.get(requireUser(userEmail));
    }

    @PatchMapping("/me")
    public MeResponse update(@RequestHeader(name = "X-User-Email", required = false) String userEmail,
                             @Valid @RequestBody UpdateMeRequest request) {
        return meService.update(requireUser(userEmail), request);
    }

    @GetMapping("/me/addresses")
    public List<AddressResponse> myAddresses(@RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return addressService.list(requireUser(userEmail));
    }

    @PostMapping("/me/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse addAddress(@RequestHeader(name = "X-User-Email", required = false) String userEmail,
                                      @Valid @RequestBody AddressUpsertRequest request) {
        return addressService.create(requireUser(userEmail), request);
    }

    @PutMapping("/me/addresses/{id}")
    public AddressResponse updateAddress(@RequestHeader(name = "X-User-Email", required = false) String userEmail,
                                         @PathVariable("id") Long id,
                                         @Valid @RequestBody AddressUpsertRequest request) {
        return addressService.update(requireUser(userEmail), id, request);
    }

    @DeleteMapping("/me/addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@RequestHeader(name = "X-User-Email", required = false) String userEmail,
                              @PathVariable("id") Long id) {
        addressService.delete(requireUser(userEmail), id);
    }

    @PostMapping("/me/addresses/{id}/default")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setDefaultAddress(@RequestHeader(name = "X-User-Email", required = false) String userEmail,
                                  @PathVariable("id") Long id) {
        addressService.setDefault(requireUser(userEmail), id);
    }

    private String requireUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return userEmail;
    }
}
