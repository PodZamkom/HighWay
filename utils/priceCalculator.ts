export interface CalculationResult {
    customsValue: number;
    customsDuty: number;
    vat: number;
    total: number;
    details: {
        auctionFee: number;
        logistics: number;
        freight: number;
        recycleFee: number;
        brokerService: number;
        commission: number;
    }
}

interface CommonParams {
    beneficiary: 'physical' | 'physical_140' | 'legal';
}

export function calculateLandedPrice(
    priceFob: number,
    carType: 'EV' | 'EREV' | 'ICE',
    params: CommonParams
): CalculationResult {

    // Constants
    const AUCTION_FEE = 1000;
    const LOCAL_LOGISTICS = 500;
    const FREIGHT = 2500;
    const BROKER_SERVICE = 500;
    const OUR_COMMISSION = 1000;
    const RECYCLE_FEE = 500; // Approx

    const customsValue = priceFob + AUCTION_FEE + LOCAL_LOGISTICS + FREIGHT;
    let customsDuty = 0;
    let vat = 0;

    if (params.beneficiary === 'legal') {
        if (carType === 'EV') {
            customsDuty = 0;
        } else {
            customsDuty = customsValue * 0.15;
        }
        vat = (customsValue + customsDuty) * 0.20;
    } else {
        // Physical
        if (carType === 'EV') {
            customsDuty = 0;
        } else {
            // Placeholder for simplified 48% logic for new ICE/EREV
            customsDuty = customsValue * 0.48;
        }

        if (params.beneficiary === 'physical_140') {
            customsDuty = customsDuty * 0.5;
        }
    }

    const total = customsValue + customsDuty + vat + RECYCLE_FEE + BROKER_SERVICE + OUR_COMMISSION;

    return {
        customsValue,
        customsDuty,
        vat,
        total,
        details: {
            auctionFee: AUCTION_FEE,
            logistics: LOCAL_LOGISTICS,
            freight: FREIGHT,
            recycleFee: RECYCLE_FEE,
            brokerService: BROKER_SERVICE,
            commission: OUR_COMMISSION
        }
    };
}
