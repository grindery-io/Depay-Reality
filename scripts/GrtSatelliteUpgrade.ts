import { ethers, upgrades } from "hardhat";

const GRT_SATELLITE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {

    const grtSatellite = await upgrades.upgradeProxy(
        GRT_SATELLITE_ADDRESS,
        await ethers.getContractFactory("GrtSatellite")
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