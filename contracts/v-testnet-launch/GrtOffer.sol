// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "./utils/GrtOfferUtils.sol";

contract GrtOffer is GrtOfferUtils {
    event LogNewOffer(
        bytes32 indexed _idOffer,
        address indexed _token,
        uint256 _chainId
    );
    event LogSetChainIdOffer(
        bytes32 indexed _idOffer,
        uint256 indexed _chainId
    );
    event LogSetTokenOffer(bytes32 indexed _idOffer, address indexed _token);
    event LogSetMinPriceLimit(
        bytes32 indexed _idOffer,
        bytes32 indexed _lowerLimitFn
    );
    event LogSetMaxPriceLimit(
        bytes32 indexed _idOffer,
        bytes32 indexed _upperLimitFn
    );
    event LogSetStatusOffer(bytes32 indexed _idOffer, bool indexed _isActive);

    error NotAllowedToModifyOffer();
    error ZeroAddressNotAllowed();

    function setChainIdOffer(bytes32 offerId, uint256 chainId) external {
        Offer storage offer = _offers[offerId];
        if(msg.sender != offer.user)
            revert NotAllowedToModifyOffer();
        offer.chainId = chainId;
        emit LogSetChainIdOffer(offerId, chainId);
    }

    function setTokenOffer(bytes32 offerId, address token) external {
        Offer storage offer = _offers[offerId];
        if(msg.sender != offer.user)
            revert NotAllowedToModifyOffer();
        offer.token = token;
        emit LogSetTokenOffer(offerId, token);
    }

    function setMinPriceLimit(
        bytes32 offerId,
        bytes calldata minPriceLimit
    ) external {
        Offer storage offer = _offers[offerId];
        if(msg.sender != offer.user)
            revert NotAllowedToModifyOffer();
        bytes32 priceLimit = keccak256(abi.encodePacked(minPriceLimit));
        offer.minPriceLimit = priceLimit;
        emit LogSetMinPriceLimit(offerId, priceLimit);
    }

    function setMaxPriceLimit(
        bytes32 offerId,
        bytes calldata maxPriceLimit
    ) external {
        Offer storage offer = _offers[offerId];
        if(msg.sender != offer.user)
            revert NotAllowedToModifyOffer();
        bytes32 priceLimit = keccak256(abi.encodePacked(maxPriceLimit));
        offer.maxPriceLimit = priceLimit;
        emit LogSetMaxPriceLimit(offerId, priceLimit);
    }

    function setIsActive(bytes32 offerId, bool isActive) external {
        Offer storage offer = _offers[offerId];
        if(msg.sender != offer.user)
            revert NotAllowedToModifyOffer();
        offer.isActive = isActive;
        emit LogSetStatusOffer(offerId, isActive);
    }

    function setOffer(
        address token,
        uint256 chainId,
        bytes calldata minPriceLimit,
        bytes calldata maxPriceLimit
    ) external returns (bytes32) {
        if(msg.sender == address(0))
            revert ZeroAddressNotAllowed();
        bytes32 offerId = keccak256(
            abi.encodePacked(msg.sender, _noncesOffer[msg.sender])
        );
        Offer storage offer = _offers[offerId];      
        offer.user = msg.sender;
        offer.isActive = true;
        offer.chainId = chainId;
        offer.token = token;
        offer.minPriceLimit = keccak256(
            abi.encodePacked(minPriceLimit)
        );
        offer.maxPriceLimit = keccak256(
            abi.encodePacked(maxPriceLimit)
        );
        emit LogNewOffer(offerId, token, chainId);
        _noncesOffer[msg.sender]++;
        return offerId;
    }

    function checkMinPriceLimitOffer(
        bytes32 offerId,
        bytes calldata minPriceLimit
    ) external view returns (bool) {
        return
            keccak256(abi.encodePacked(minPriceLimit)) ==
            _offers[offerId].minPriceLimit;
    }

    function checkMaxPriceLimitOffer(
        bytes32 offerId,
        bytes calldata maxPriceLimit
    ) external view returns (bool) {
        return
            keccak256(abi.encodePacked(maxPriceLimit)) ==
            _offers[offerId].maxPriceLimit;
    }
}
