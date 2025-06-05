// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtMuseumNFT is ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    event NFTMinted(uint256 indexed tokenId, address owner, string tokenURI);

    mapping(uint256 => string) public artworkTitle;

    constructor() ERC721("AI Art Museum", "AIAM") Ownable(msg.sender) {}

    function mintNFT(
        address recipient,
        string memory tokenURI_,
        string memory title
    ) public returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI_);

        artworkTitle[newItemId] = title;

        emit NFTMinted(newItemId, recipient, tokenURI_);
        return newItemId;
    }

    function getNFTTitle(uint256 tokenId) public view returns (string memory) {
        require(ownerOf(tokenId) != address(0), "NFT does not exist");
        return artworkTitle[tokenId];
    }

    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds;
    }

    // --- OVERRIDE các hàm cần thiết do đa kế thừa trong OpenZeppelin v5 ---

    function _increaseBalance(address account, uint128 value) 
        internal 
        override(ERC721, ERC721Enumerable) 
    {
        super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override(ERC721, ERC721Enumerable) 
        returns (address) 
    {
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}