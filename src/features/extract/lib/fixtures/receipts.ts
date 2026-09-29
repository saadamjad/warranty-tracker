// Realistic receipt texts as a reader would return them, including the noise it produces.
// `expected` lists only what a person would agree is on the receipt; absent means "not found".

export type Fixture = {
  name: string;
  text: string;
  expected: Partial<Record<"merchant" | "purchaseDate" | "amount" | "currency" | "reference" | "serial" | "model" | "warrantyMonths", string>>;
  /** Fields that must come back as a choice rather than a single answer. */
  ambiguous?: string[];
};

export const RECEIPTS: Fixture[] = [
  {
    name: "Pakistani electronics store, tax invoice",
    text: `SALES TAX INVOICE
HI-FI ELECTRONICS
Shop 12, Hall Road, Lahore
NTN: 1234567-8  Tel: 042-3711-2233
Invoice No: HF-2026-0412
Date: 14/03/2026  Time: 16:22
Samsung 55" Crystal UHD TV
Model: UA55AU7700
S/N: 0B9K3ZAT500123
Qty 1   Rs 164,999.00
Sub Total      164,999.00
GST 18%         29,699.82
Grand Total  Rs 194,698.82
1 Year Warranty from date of purchase`,
    expected: {
      merchant: "Hi-Fi Electronics",
      purchaseDate: "2026-03-14",
      amount: "194698.82",
      currency: "PKR",
      reference: "HF-2026-0412",
      serial: "0B9K3ZAT500123",
      model: "UA55AU7700",
      warrantyMonths: "12",
    },
  },
  {
    name: "Supermarket receipt with card payment",
    text: `METRO CASH & CARRY
Thokar Niaz Baig
Receipt # 55012-99
12/08/2026 10:32
MILK 1L        x2    520.00
BREAD                180.00
Total Items 3
TOTAL           PKR  700.00
VISA 4111 1111 1111 1111
AUTH 004411`,
    expected: { merchant: "Metro Cash & Carry", purchaseDate: "2026-08-12", amount: "700.00", currency: "PKR", reference: "55012-99" },
  },
  {
    name: "US online order confirmation",
    text: `Amazon.com
Order Placed: March 4, 2026
Order ID 113-4567890-1234567
Anker PowerCore 20000
Item(s) Subtotal: $45.99
Estimated tax: $3.68
Grand Total: $49.67
Paid with Visa ending in XXXX XXXX XXXX 4242`,
    expected: { merchant: "Amazon.com", purchaseDate: "2026-03-04", amount: "49.67", currency: "USD", reference: "113-4567890-1234567" },
  },
  {
    name: "UK high street receipt",
    text: `CURRYS
Store 0231 Oxford St
VAT No GB 123 4567 89
Date 21/06/2026
Dyson V8 Cordless     £249.00
Total                 £249.00
2 years warranty included`,
    expected: { merchant: "Currys", purchaseDate: "2026-06-21", amount: "249.00", currency: "GBP", warrantyMonths: "24" },
  },
  {
    name: "European receipt with comma decimals",
    text: `MEDIAMARKT
Filiale Berlin
Datum: 02.05.2026
Philips Airfryer    129,99
Summe EUR           129,99
Total               129,99`,
    expected: { merchant: "Mediamarkt", amount: "129.99", currency: "EUR" },
    ambiguous: ["purchaseDate"],
  },
  {
    name: "Indian phone shop with IMEI",
    text: `SANGEETHA MOBILES
Bill No: SM/2026/7781
Date: 15-Jan-2026
Redmi Note 13 5G
IMEI 356938035643809
Net Amount ₹ 17,999.00
Warranty: 1 year`,
    expected: {
      merchant: "Sangeetha Mobiles",
      purchaseDate: "2026-01-15",
      amount: "17999.00",
      currency: "INR",
      reference: "SM/2026/7781",
      serial: "356938035643809",
      warrantyMonths: "12",
    },
  },
  {
    name: "Dubai receipt",
    text: `SHARAF DG
Mall of the Emirates
TAX INVOICE No. 88213400
Date 2026-07-19
Apple AirPods Pro 2    AED 899.00
VAT 5%                 AED 42.81
Total Amount (Incl VAT) AED 899.00`,
    expected: { merchant: "Sharaf Dg", purchaseDate: "2026-07-19", amount: "899.00", currency: "AED", reference: "88213400" },
  },
  {
    name: "Handwritten-style cash memo, little readable",
    text: `CASH MEMO
Al-Madina Traders
No. 442
Ceiling fan 1
Total 8500`,
    expected: { merchant: "Al-Madina Traders", amount: "8500.00" },
  },
  {
    name: "Faded thermal receipt with OCR noise",
    text: `W3LCOME
|| CHASE UP ||
Dt: 03/O9/2026
T0TAL  2,4S0.00
thank you`,
    expected: { merchant: "Chase Up" },
  },
  {
    name: "Receipt with ambiguous numeric date",
    text: `J. Electronics
Bill Date: 04/05/2026
Iron   3,200
Total  3,200`,
    expected: { merchant: "J. Electronics", amount: "3200.00" },
    ambiguous: ["purchaseDate"],
  },
  {
    name: "Warranty card only",
    text: `WARRANTY CARD
Haier Pakistan
Model No. HRF-438
Serial No. HR43822019A
Date of Purchase: 10 Feb 2026
This product carries 5 years warranty on compressor`,
    expected: {
      merchant: "Haier Pakistan",
      purchaseDate: "2026-02-10",
      model: "HRF-438",
      serial: "HR43822019A",
      warrantyMonths: "60",
    },
  },
  {
    name: "Restaurant-style bill with change",
    text: `KHAAS FOODS
Order # 2231
18/09/2026
Items  1,450.00
Tax      232.00
Net Payable  1,682.00
Cash Tendered 2,000.00
Change    318.00`,
    expected: { merchant: "Khaas Foods", purchaseDate: "2026-09-18", amount: "1682.00", reference: "2231" },
  },
  {
    name: "Two totals that disagree",
    text: `GADGET HUB
Total 1,000.00
Total 1,180.00`,
    expected: { merchant: "Gadget Hub" },
    ambiguous: ["amount"],
  },
  {
    name: "Screenshot of a payment confirmation with a due date",
    text: `Daraz.pk
Order Number: 190234881203
Order Date 22 Aug 2026
Delivery by 27 Aug 2026
Total: Rs. 3,499`,
    expected: { merchant: "Daraz.pk", purchaseDate: "2026-08-22", amount: "3499.00", currency: "PKR", reference: "190234881203" },
  },
  {
    name: "Receipt with no date and no currency",
    text: `LOCAL HARDWARE
Drill machine
TOTAL 6,750`,
    expected: { merchant: "Local Hardware", amount: "6750.00" },
  },
  {
    name: "Canadian receipt",
    text: `BEST BUY
Transaction # 7781-22
2026/05/30
Headphones   C$ 199.99
Total        C$ 225.99`,
    expected: { merchant: "Best Buy", purchaseDate: "2026-05-30", amount: "225.99", currency: "CAD", reference: "7781-22" },
  },
];
