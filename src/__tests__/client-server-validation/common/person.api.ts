
export interface BankAccount {
    iban: string;
    owner: string;
}

export interface Address {
    postalCode: string;
    city: string;
}

export interface Person {
    name: string;
    address: Address;
    bankAccounts: BankAccount[];
}
