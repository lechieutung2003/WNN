// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtMuseumNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    
    // Mapping từ tokenId đến title
    mapping(uint256 => string) private _tokenTitles;
    
    // Custom enumerable functionality
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;
    uint256[] private _allTokens;
    mapping(uint256 => uint256) private _allTokensIndex;

    event NFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI, string title);

    constructor() ERC721("Art Museum NFT", "AMNFT") Ownable(_msgSender()) {}

    function mintNFT(address recipient, string memory tokenURI, string memory title) 
        public 
        returns (uint256) 
    {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _tokenTitles[newTokenId] = title;

        emit NFTMinted(newTokenId, recipient, tokenURI, title);
        return newTokenId;
    }

    function getNFTTitle(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        return _tokenTitles[tokenId];
    }

    function getTotalSupply() public view returns (uint256) {
        return _tokenIds;
    }

    // Custom enumerable functions
    function totalSupply() public view returns (uint256) {
        return _allTokens.length;
    }

    function tokenByIndex(uint256 index) public view returns (uint256) {
        require(index < totalSupply(), "Global index out of bounds");
        return _allTokens[index];
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "Owner index out of bounds");
        return _ownedTokens[owner][index];
    }

    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    // Override _update để maintain enumerable data
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Nếu đây là mint (from == address(0))
        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        }
        // Nếu đây là burn (to == address(0))
        else if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        }
        
        // Update owner enumeration
        if (from != address(0) && from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        
        // Call parent _update
        address previousOwner = super._update(to, tokenId, auth);
        
        // Add to new owner enumeration
        if (to != address(0) && from != to) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
        
        return previousOwner;
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
        _ownedTokensIndex[tokenId] = length;
    }

    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];
    }

    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId;
        _allTokensIndex[lastTokenId] = tokenIndex;

        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function batchMintNFT(
        address[] memory recipients,
        string[] memory tokenURIs,
        string[] memory titles
    ) public onlyOwner returns (uint256[] memory) {
        require(
            recipients.length == tokenURIs.length && 
            tokenURIs.length == titles.length,
            "Arrays length mismatch"
        );

        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mintNFT(recipients[i], tokenURIs[i], titles[i]);
        }
        
        return tokenIds;
    }

    // Thêm function để lấy tất cả NFT metadata của một owner
    function getNFTsWithMetadata(address owner) external view returns (
        uint256[] memory tokenIds,
        string[] memory titles,
        string[] memory tokenURIs
    ) {
        uint256[] memory ownerTokens = tokensOfOwner(owner);
        uint256 length = ownerTokens.length;
        
        tokenIds = new uint256[](length);
        titles = new string[](length);
        tokenURIs = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = ownerTokens[i];
            tokenIds[i] = tokenId;
            titles[i] = _tokenTitles[tokenId];
            tokenURIs[i] = tokenURI(tokenId);
        }
        
        return (tokenIds, titles, tokenURIs);
    }

    // Support interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}