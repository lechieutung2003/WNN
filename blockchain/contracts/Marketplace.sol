// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Marketplace is ReentrancyGuard, Ownable, Pausable {
    struct Listing {
        uint256 tokenId;
        address nftContract;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    // Phí marketplace (2.5%)
    uint256 public marketplaceFee = 250; // 250/10000 = 2.5%
    uint256 private constant FEE_DENOMINATOR = 10000;
    uint256 private constant MAX_FEE = 1000; // 10% maximum fee

    // Mapping từ NFT contract + tokenId đến listing
    mapping(address => mapping(uint256 => Listing)) public listings;
    
    // Array để track tất cả listings
    uint256 public listingCounter;
    mapping(uint256 => address) public listingContracts;
    mapping(uint256 => uint256) public listingTokenIds;

    // Mapping để track volume và fees
    mapping(address => uint256) public userSalesVolume;
    uint256 public totalVolume;
    uint256 public totalFeesCollected;

    // Events
    event ItemListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event ItemSold(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        uint256 fee
    );

    event ListingCancelled(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller
    );

    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    
    event FeesWithdrawn(address indexed owner, uint256 amount);

    // Cập nhật constructor theo v5.0+
    constructor() Ownable(_msgSender()) {}

    // Tạo listing mới
    function createListing(address nftContract, uint256 tokenId, uint256 price) external nonReentrant whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        require(nftContract != address(0), "Invalid NFT contract");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == _msgSender(), "You don't own this NFT");
        require(
            nft.getApproved(tokenId) == address(this) || 
            nft.isApprovedForAll(_msgSender(), address(this)),
            "Marketplace not approved to transfer NFT"
        );
        require(!listings[nftContract][tokenId].active, "NFT already listed");

        // Kiểm tra xem NFT này đã từng có listing ID chưa
        uint256 existingListingId = _getListingId(nftContract, tokenId);
        uint256 listingId;
        
        if (existingListingId == 0) {
            // NFT chưa từng được list, tạo listing ID mới
            listingCounter++;
            listingId = listingCounter;
            listingContracts[listingId] = nftContract;
            listingTokenIds[listingId] = tokenId;
        } else {
            // NFT đã từng được list, sử dụng lại listing ID cũ
            listingId = existingListingId;
        }

        listings[nftContract][tokenId] = Listing({
            tokenId: tokenId,
            nftContract: nftContract,
            seller: _msgSender(),
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        emit ItemListed(listingId, nftContract, tokenId, _msgSender(), price);
    }
    
    // Mua NFT
    function buyItem(address nftContract, uint256 tokenId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(_msgSender() != listing.seller, "Cannot buy your own NFT");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == listing.seller, "Seller no longer owns NFT");

        // Tính phí
        uint256 marketplaceFeeAmount = (listing.price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = listing.price - marketplaceFeeAmount;

        // Cập nhật tracking
        userSalesVolume[listing.seller] += listing.price;
        totalVolume += listing.price;
        totalFeesCollected += marketplaceFeeAmount;

        // Đánh dấu listing không còn active
        listing.active = false;

        // Chuyển NFT
        nft.safeTransferFrom(listing.seller, _msgSender(), tokenId);

        // Chuyển tiền cho seller
        (bool success, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(success, "Transfer to seller failed");

        // Hoàn lại tiền thừa nếu có
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(_msgSender()).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }

        emit ItemSold(
            _getListingId(nftContract, tokenId),
            nftContract,
            tokenId,
            listing.seller,
            _msgSender(),
            listing.price,
            marketplaceFeeAmount
        );
    }

    // Hủy listing
    function cancelListing(address nftContract, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.active, "Listing not active");
        require(listing.seller == _msgSender(), "Only seller can cancel");

        listing.active = false;

        emit ListingCancelled(
            _getListingId(nftContract, tokenId),
            nftContract,
            tokenId,
            _msgSender()
        );
    }

    // Lấy thông tin listing
    function getListing(address nftContract, uint256 tokenId) 
        external 
        view 
        returns (Listing memory) 
    {
        return listings[nftContract][tokenId];
    }

    // Lấy tất cả listings active
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        
        // Đếm số lượng active listings
        for (uint256 i = 1; i <= listingCounter; i++) {
            address nftContract = listingContracts[i];
            uint256 tokenId = listingTokenIds[i];
            if (listings[nftContract][tokenId].active) {
                activeCount++;
            }
        }

        // Tạo array với kích thước chính xác
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= listingCounter; i++) {
            address nftContract = listingContracts[i];
            uint256 tokenId = listingTokenIds[i];
            if (listings[nftContract][tokenId].active) {
                activeListings[currentIndex] = listings[nftContract][tokenId];
                currentIndex++;
            }
        }

        return activeListings;
    }

    // Lấy listings của một seller cụ thể
    function getListingsBySeller(address seller) external view returns (Listing[] memory) {
        uint256 sellerListingCount = 0;
        
        // Đếm số lượng active listings của seller
        for (uint256 i = 1; i <= listingCounter; i++) {
            address nftContract = listingContracts[i];
            uint256 tokenId = listingTokenIds[i];
            if (listings[nftContract][tokenId].active && listings[nftContract][tokenId].seller == seller) {
                sellerListingCount++;
            }
        }

        // Tạo array với kích thước chính xác
        Listing[] memory sellerListings = new Listing[](sellerListingCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= listingCounter; i++) {
            address nftContract = listingContracts[i];
            uint256 tokenId = listingTokenIds[i];
            if (listings[nftContract][tokenId].active && listings[nftContract][tokenId].seller == seller) {
                sellerListings[currentIndex] = listings[nftContract][tokenId];
                currentIndex++;
            }
        }

        return sellerListings;
    }

    // Helper function để lấy listing ID
    function _getListingId(address nftContract, uint256 tokenId) private view returns (uint256) {
        for (uint256 i = 1; i <= listingCounter; i++) {
            if (listingContracts[i] == nftContract && listingTokenIds[i] == tokenId) {
                return i;
            }
        }
        return 0;
    }

    // Cập nhật phí marketplace (chỉ owner)
    function updateMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee cannot exceed 10%");
        
        uint256 oldFee = marketplaceFee;
        marketplaceFee = newFee;
        
        emit MarketplaceFeeUpdated(oldFee, newFee);
    }

    // Rút phí marketplace (chỉ owner)
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FeesWithdrawn(owner(), balance);
    }

    // Pause/Unpause marketplace
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency function để hủy tất cả listings
    function emergencyCancel(address nftContract, uint256 tokenId) external onlyOwner {
        require(paused(), "Can only emergency cancel when paused");
        
        Listing storage listing = listings[nftContract][tokenId];
        if (listing.active) {
            listing.active = false;
            emit ListingCancelled(
                _getListingId(nftContract, tokenId),
                nftContract,
                tokenId,
                listing.seller
            );
        }
    }

    // Thêm function để lấy thống kê marketplace
    function getMarketplaceStats() external view returns (
        uint256 totalListings,
        uint256 activeListings,
        uint256 _totalVolume,
        uint256 _totalFeesCollected,
        uint256 _marketplaceFee
    ) {
        uint256 active = 0;
        for (uint256 i = 1; i <= listingCounter; i++) {
            address nftContract = listingContracts[i];
            uint256 tokenId = listingTokenIds[i];
            if (listings[nftContract][tokenId].active) {
                active++;
            }
        }
        
        return (
            listingCounter,
            active,
            totalVolume,
            totalFeesCollected,
            marketplaceFee
        );
    }

    // Thêm function để cập nhật giá listing
    function updateListingPrice(address nftContract, uint256 tokenId, uint256 newPrice) external nonReentrant {
        require(newPrice > 0, "Price must be greater than 0");
        
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.active, "Listing not active");
        require(listing.seller == _msgSender(), "Only seller can update price");
        
        uint256 oldPrice = listing.price;
        listing.price = newPrice;
        
        // Emit event như một listing mới
        emit ItemListed(
            _getListingId(nftContract, tokenId),
            nftContract,
            tokenId,
            _msgSender(),
            newPrice
        );
    }

    // Fallback function để nhận ETH
    receive() external payable {
        // Contract có thể nhận ETH
    }

    // Function để kiểm tra contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}