export interface PaymentMethodDto {
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
    description?: string;
    type: 'card' | 'wallet' | 'banking' | 'qr_code';
    requires_redirect?: boolean;
    supports_qr_code?: boolean;
    bank_code?: string;
    min_amount?: number;
    max_amount?: number;
}

export interface PaymentMethodsResponse {
    methods: PaymentMethodDto[];
    default_method?: string;
}
