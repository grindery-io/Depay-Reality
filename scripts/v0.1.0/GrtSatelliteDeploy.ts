import { ethers, upgrades } from "hardhat";

async function main() {

    const grtSatellite = await upgrades.deployProxy(
        await ethers.getContractFactory(
            "contracts/v0.1.0/GrtSatellite.sol:GrtSatellite"
        )
    );

    await grtSatellite.deployed();
    await grtSatellite.initializeSatellite();

    console.log("GRT satellite deployed to:", grtSatellite.address);
    console.log("GRT satellite - owner address:", await grtSatellite.owner());

}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error)
    process.exit(1)
})