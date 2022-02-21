// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.10;

import 'hardhat/console.sol';
import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {Counters} from '@openzeppelin/contracts/utils/Counters.sol';
import {Strings} from '@openzeppelin/contracts/utils/Strings.sol';
import {Math} from '@openzeppelin/contracts/utils/math/Math.sol';

import {StringUtils} from './libraries/StringUtils.sol';
import {BytesLib} from './libraries/BytesLib.sol';
import {Base64} from './libraries/Base64.sol';

// import { ERC721URIStorage } from "./libraries/ERC721URIStorage.sol";

contract Registry is ERC721 {
    using Counters for Counters.Counter;

    struct Record {
        string recordType;
        string key;
        bytes value;
    }

    error Unauthorized();
    error AlreadyRegistered();
    error InvalidName(string name);

    // mapping(string => address) public domains;

    // mapping(string => string) public records;
    mapping(string => mapping(bytes => Record)) public records;

    mapping(uint256 => string) public names;
    mapping(string => uint256) public namesToIds;

    Counters.Counter private _tokenIds;

    string public tld;

    address payable public owner;

    string svgPartOne =
        '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#cb5eee"/><stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    string svgPartTwo = '</text></svg>';

    constructor(string memory _tld) payable ERC721('Polygon Name Service', 'PNS') {
        owner = payable(msg.sender);
        tld = _tld;

        console.log('%s name service deployed', tld);
        console.log('Owner: %s', owner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyDomainOwner(string memory domainName) {
        if (getDomainOwner(domainName) != msg.sender) revert Unauthorized();
        _;
    }

    function bytesToAddress(bytes memory data) internal pure returns (address addr) {
        return BytesLib.toAddress(data, 76);
    }

    function priceToRegisterDomain(string calldata domainName) public pure returns (uint256) {
        uint256 len = StringUtils.strlen(domainName);

        require(len > 2);

        return Math.max((5 * 10**17) / (len / 2), 1 * 10**17) / 1000;
    }

    function getRecordHashKey(string memory recordType, string memory key) public pure returns (bytes memory) {
        return abi.encode(['string', 'string'], [recordType, key]);
    }

    function getDomainOwner(string memory domain) public view returns (address) {
        bytes memory recordValue = getRecordValue(domain, 'address', 'owner');

        if (recordValue.length == 0) {
            return address(0);
        }

        address domainOwner = bytesToAddress(recordValue);
        return domainOwner;
    }

    function _setDomainOwner(string memory domainName, address ownerAddress) internal {
        _setRecord(domainName, 'address', 'owner', abi.encode(ownerAddress));
    }

    function setRecord(
        string memory domain,
        string memory recordType,
        string memory key,
        bytes memory value
    ) public onlyDomainOwner(domain) {
        _setRecord(domain, recordType, key, value);
    }

    function _setRecord(
        string memory domain,
        string memory recordType,
        string memory key,
        bytes memory value
    ) internal {
        // console.log("recordType: %s, key: %s, hashkey: %s", recordType, key, abi.decode getRecordHashKey(recordType, key));
        Record storage record = records[domain][getRecordHashKey(recordType, key)];
        record.recordType = recordType;
        record.key = key;
        record.value = abi.encode(value);
    }

    function getRecordValue(
        string memory domain,
        string memory recordType,
        string memory key
    ) public view returns (bytes memory) {
        return records[domain][getRecordHashKey(recordType, key)].value;
    }

    function register(string calldata domainName) public payable {
        if (getDomainOwner(domainName) != address(0)) revert AlreadyRegistered();
        // require(getDomainOwner(domainName) != address(0), "already registered");
        if (!isValidDomainName(domainName)) revert InvalidName(domainName);

        uint256 _price = priceToRegisterDomain(domainName);

        require(msg.value >= _price, 'Insufficient funds for domain registration.');

        uint256 newRecordId = _tokenIds.current();

        console.log('Registering %s.%s on the contract with tokenID %d', domainName, tld, newRecordId);

        _safeMint(msg.sender, newRecordId);

        _setDomainOwner(domainName, msg.sender);

        names[newRecordId] = domainName;
        namesToIds[domainName] = newRecordId;
        _tokenIds.increment();
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), 'ERC721URIStorage: URI query for nonexistent token');

        string memory domainName = names[tokenId];

        uint256 length = StringUtils.strlen(domainName);
        string memory strLen = Strings.toString(length);

        string memory _name = string(abi.encodePacked(domainName, '.', tld));
        string memory finalSvg = string(abi.encodePacked(svgPartOne, _name, svgPartTwo));

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        _name,
                        '", "description": "A domain on the Polygon Name Service", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(finalSvg)),
                        '","length":"',
                        strLen,
                        '"}'
                    )
                )
            )
        );

        string memory finalTokenUri = string(abi.encodePacked('data:application/json;base64,', json));

        console.log('\n--------------------------------------------------------');
        console.log('Final tokenURI', finalTokenUri);
        console.log('--------------------------------------------------------\n');

        return finalTokenUri;
    }

    function transferDomain(string memory domainName, address transferTo) public onlyDomainOwner(domainName) {
        _transferDomain(domainName, transferTo);
    }

    function getTokenIdForDomainName(string memory domainName) public view returns (uint256) {
        return namesToIds[domainName];
    }

    function _transferDomain(string memory domainName, address transferTo) internal {
        uint256 tokenId = getTokenIdForDomainName(domainName);
        safeTransferFrom(msg.sender, transferTo, tokenId);
        _setDomainOwner(domainName, transferTo);
    }

    function getAllDomainNames() public view returns (string[] memory) {
        console.log('Getting all names from contract');
        string[] memory allNames = new string[](_tokenIds.current());

        for (uint256 i = 0; i < _tokenIds.current(); i++) {
            allNames[i] = names[i];
            console.log('Name for tokenID %d is %s', i, allNames[i]);
        }

        return allNames;
    }

    function isValidDomainName(string calldata domainName) public pure returns (bool) {
        uint256 len = StringUtils.strlen(domainName);

        return len >= 3 && len <= 64;
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;

        (bool success, ) = msg.sender.call{value: amount}('');
        require(success, 'Failed to withdraw Matic');
    }
}
