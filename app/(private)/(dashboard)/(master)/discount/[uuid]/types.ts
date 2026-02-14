export type KeyComboType = {
  Location: string;
  Customer: string;
  Item: string;
};

export type KeyOption = { label: string; id: string; isSelected: boolean };

export type KeyGroup = { type: keyof KeyComboType; options: KeyOption[] };

export type DiscountItemType = {
  key: string; // Item or Category ID
  rate: string;
  idx: string;
};

export interface DiscountState {
  name: string;
  salesTeam: string[];
  projects: string[];
  scope: "header" | "details";
  discountMethod: "Amount" | "Percentage";
  discountItems: DiscountItemType[];
  
  discountType: string;
  discountValue: string;
  minQuantity: string;
  minOrderValue: string;
  startDate: string;
  endDate: string;
  status: string | number;
  header: {
    headerMinAmount: string;
    headerRate: string;
  };
}

