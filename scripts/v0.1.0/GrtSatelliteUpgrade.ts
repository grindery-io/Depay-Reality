import { ethers, upgrades } from "hardhat";

const GRT_SATELLITE_ADDRESS = "0xef468d8bde6cab3e678587415226a3d4baac5f01";

async function main() {

    const grtSatellite = await upgrades.upgradeProxy(
        GRT_SATELLITE_ADDRESS,
        await ethers.getContractFactory(
            "contracts/v0.1.0/GrtSatellite.sol:GrtSatellite"
        )
    );

    console.log("GRT satellite upgraded to:", grtSatellite.address);
    console.log("GRT satellite - owner address:", await grtSatellite.owner());

}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error)
    process.exit(1)
})