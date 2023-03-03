import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import PriceTestAbi from "../../artifacts/contracts/v0.2.0//priceUpdate/PriceTest.sol/PriceTest.json";
import { Contract } from 'ethers';



describe("Grindery Offer testings", function () {

    // const chainId = 5;
    // const chainId = 6;
    const nbrRequest = 4;
    const nbrOffer = 4;
    const chainId = 31337;

    let owner: SignerWithAddress,
        user1: SignerWithAddress,
        user2: SignerWithAddress,
        user3: SignerWithAddress,
        user4: SignerWithAddress,
        user5: SignerWithAddress,
        grtOffer: Contract,
        priceTest: Contract,
        realityEth: Contract,
        chainlinkTest: Contract,
        grtToken: Contract,
        token: Contract,
        args: string,
        fnPrice: string,
        grtSatellite: any;


    beforeEach(async function() {

        [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

        grtOffer = await upgrades.deployProxy(await ethers.getContractFactory(
            "contracts/v0.2.0/GrtOffer.sol:GrtOffer"
        ));
        await grtOffer.deployed();

        priceTest = await (await ethers.getContractFactory(
            "contracts/v0.2.0/priceUpdate/PriceTest.sol:PriceTest"
        )).deploy();
        await priceTest.deployed();

        grtToken = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await grtToken.deployed();

        token = await (await ethers.getContractFactory("ERC20Sample")).deploy();
        await token.deployed();

        chainlinkTest = await (await ethers.getContractFactory(
            "contracts/v0.2.0/priceUpdate/ChainlinkTest.sol:ChainlinkTest"
        )).deploy();
        await chainlinkTest.deployed();

        // initialize contract
        await grtOffer.initializeGrtOffer();

        // const abi = ethers.utils.defaultAbiCoder;
        args = ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256"], // encode as address array
            [10, 30]
        );

        fnPrice = "setPrice(uint256,uint256)";

    });


    describe("External update price contract framework", function () {
        it("Should encode arguments for price udpates", async function () {
            expect(
                await priceTest.encodeArgs(10, 30)
            ).to.equal(args);
        });

        it("Should encode arguments for price udpates", async function () {

            // console.log(await grtOffer.getUpperPriceLimitFromGrindery(
            //     "0xd2b8dbec86dba5f9b5c34f84d0dc19bf715f984e3c78051e5ffa813a1d29dd73",
            //     ethers.utils.defaultAbiCoder.encode(
            //         ["address", "uint256"], // encode as address array
            //         [chainlinkTest.address, 30]
            //     )
            // ));

        });


    });

    // describe("GRT offer with external contract call", function () {

    //     describe("Set the offer", function () {

    //         it("Should emit a new event", async function () {
    //             const nonceUser = grtOffer.getNonceUser(owner.address);
    //             await expect(
    //                 await grtOffer.connect(owner).setOfferWithAddress(
    //                     token.address,
    //                     priceTest.address,
    //                     fnPrice,
    //                     fnPrice
    //                 )
    //             )
    //             .to.emit(grtOffer, "LogNewOffer")
    //             .withArgs(
    //                 ethers.utils.keccak256(
    //                     ethers.utils.solidityPack(
    //                         ["address", "uint256", "address"],
    //                         [owner.address, (await nonceUser).toString(), priceTest.address]
    //                     )
    //                 ),
    //                 priceTest.address,
    //                 token.address
    //             );
    //         });

    //         it("Should set the proper external address", async function () {
    //             const nonceUser = grtOffer.getNonceUser(owner.address);
    //             await grtOffer.connect(owner).setOfferWithAddress(
    //                 token.address,
    //                 priceTest.address,
    //                 fnPrice,
    //                 fnPrice
    //             );
    //             expect(
    //                 await grtOffer.getAddressOffer(
    //                     ethers.utils.keccak256(
    //                         ethers.utils.solidityPack(
    //                             ["address", "uint256", "address"],
    //                             [owner.address, (await nonceUser).toString(), priceTest.address]
    //                         )
    //                     )
    //                 )
    //             ).to.equal(priceTest.address);
    //         });

    //         it("Should set the proper lower limit price function", async function () {
    //             const nonceUser = grtOffer.getNonceUser(owner.address);
    //             await grtOffer.connect(owner).setOfferWithAddress(
    //                 token.address,
    //                 priceTest.address,
    //                 fnPrice,
    //                 fnPrice
    //             );
    //             expect(
    //                 await grtOffer.getLowerLimitFnHashOffer(
    //                     ethers.utils.keccak256(
    //                         ethers.utils.solidityPack(
    //                             ["address", "uint256", "address"],
    //                             [owner.address, (await nonceUser).toString(), priceTest.address]
    //                         )
    //                     )
    //                 )
    //             ).to.equal(
    //                 ethers.utils.keccak256(
    //                     ethers.utils.solidityPack(
    //                         ["string"],
    //                         [fnPrice]
    //                     )
    //                 )
    //             );
    //         });

    //         it("Should set the proper upper limit price function", async function () {
    //             const nonceUser = grtOffer.getNonceUser(owner.address);
    //             await grtOffer.connect(owner).setOfferWithAddress(
    //                 token.address,
    //                 priceTest.address,
    //                 fnPrice,
    //                 fnPrice
    //             );
    //             expect(
    //                 await grtOffer.getUpperLimitFnHashOffer(
    //                     ethers.utils.keccak256(
    //                         ethers.utils.solidityPack(
    //                             ["address", "uint256", "address"],
    //                             [owner.address, (await nonceUser).toString(), priceTest.address]
    //                         )
    //                     )
    //                 )
    //             ).to.equal(
    //                 ethers.utils.keccak256(
    //                     ethers.utils.solidityPack(
    //                         ["string"],
    //                         [fnPrice]
    //                     )
    //                 )
    //             );
    //         });

    //         it("Nonce of the user should be increased by 1", async function () {
    //             await grtOffer.connect(owner).setOfferWithAddress(
    //                 token.address,
    //                 priceTest.address,
    //                 fnPrice,
    //                 fnPrice
    //             );
    //             const newNonceUser = grtOffer.getNonceUser(owner.address);
    //             expect(
    //                 (await newNonceUser).toString()
    //             ).to.equal(
    //             "1"
    //             );
    //         });
    //     });


    //     describe("Get upper limit price", function () {

    //         it("Should return setPrice result (a + b)", async function () {
    //             const nonceUser = grtOffer.getNonceUser(owner.address);
    //             await grtOffer.connect(owner).setOfferWithAddress(
    //                 token.address,
    //                 priceTest.address,
    //                 fnPrice,
    //                 fnPrice
    //             );

    //             // let ABI = [
    //             //     "setPrice(uint256 a, uint256 b)"
    //             // ];
    //             // let iface = new ethers.utils.Interface(PriceTestAbi.abi);

    //             // console.log(iface.encodeFunctionData("setPrice", [
    //             //     ethers.utils.parseEther("1.0"), ethers.utils.parseEther("1.0")]));


    //             console.log( new ethers.utils.Interface(PriceTestAbi.abi)
    //             .encodeFunctionData("setPrice", [10, 30]));

    //             expect(
    //                 await grtOffer.getUpperLimit(
    //                     ethers.utils.keccak256(
    //                         ethers.utils.solidityPack(
    //                             ["address", "uint256", "address"],
    //                             [owner.address, (await nonceUser).toString(), priceTest.address]
    //                         )
    //                     ),
    //                     fnPrice,
    //                     // "10, 30",

    //                     new ethers.utils.Interface(PriceTestAbi.abi)
    //                     .encodeFunctionData("setPrice", [10, 30])
    //                     // // ethers.utils.defaultAbiCoder.encodeWithSignature(
    //                     // //     ["string", "uint256", "uint256"], // encode as address array
    //                     // //     [fnPrice, 10, 30]
    //                     // // )
    //                     // iface.encodeFunctionData("setPrice", [
    //                     //     ethers.utils.parseEther("1.0"), ethers.utils.parseEther("1.0")])
    //                 )
    //             ).to.equal(
    //                 "40"
    //             );



    //         });

    //     });

    // });



});