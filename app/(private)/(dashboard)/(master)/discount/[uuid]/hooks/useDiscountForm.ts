import { useState, useCallback } from "react";
import { KeyComboType, DiscountState } from "../types";
import { initialDiscountState } from "../utils/constants";

export function useDiscountForm() {
  const [keyCombo, setKeyCombo] = useState<KeyComboType>({
    Location: "",
    Customer: "",
    Item: "",
  });

  const [keyValue, setKeyValue] = useState<Record<string, string[]>>({});
  const [discount, setDiscount] = useState<DiscountState>(initialDiscountState);
  const [extraCustomerOptions, setExtraCustomerOptions] = useState<any[]>([]);

  return {
    keyCombo,
    setKeyCombo,
    keyValue,
    setKeyValue,
    discount,
    setDiscount,
    extraCustomerOptions,
    setExtraCustomerOptions
  };
}
