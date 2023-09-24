import type {
    AMMBid,
    AMMCreate,
    AMMDelete,
    AMMDeposit,
    AMMVote,
    AMMWithdraw,
    AccountDelete,
    AccountSet,
    CheckCancel,
    CheckCash,
    CheckCreate,
    Clawback,
    DepositPreauth,
    EscrowCancel,
    EscrowCreate,
    EscrowFinish,
    NFTokenAcceptOffer,
    NFTokenBurn,
    NFTokenCancelOffer,
    NFTokenCreateOffer,
    NFTokenMint,
    OfferCancel,
    OfferCreate,
    Payment,
    PaymentChannelClaim,
    PaymentChannelCreate,
    PaymentChannelFund,
    SetRegularKey,
    SignerListSet,
    TicketCreate,
    Transaction,
    TrustSet,
    XChainAccountCreateCommit,
    XChainAddAccountCreateAttestation,
    XChainAddClaimAttestation,
    XChainClaim,
    XChainCommit,
    XChainCreateBridge,
    XChainCreateClaimID,
    XChainModifyBridge,
} from "xrpl";
import type { AccountTransaction } from "./xrpl.types";

export type XrplAccountIndexerEvents = {
    Transaction: (transaction: AccountTransaction<Transaction>) => Promise<void> | void;
    AccountDelete: (transaction: AccountTransaction<AccountDelete>) => void;
    AccountSet: (transaction: AccountTransaction<AccountSet>) => void;
    AMMBid: (transaction: AccountTransaction<AMMBid>) => void;
    AMMDelete: (transaction: AccountTransaction<AMMDelete>) => void;
    AMMDeposit: (transaction: AccountTransaction<AMMDeposit>) => void;
    AMMCreate: (transaction: AccountTransaction<AMMCreate>) => void;
    AMMVote: (transaction: AccountTransaction<AMMVote>) => void;
    AMMWithdraw: (transaction: AccountTransaction<AMMWithdraw>) => void;
    CheckCancel: (transaction: AccountTransaction<CheckCancel>) => void;
    CheckCash: (transaction: AccountTransaction<CheckCash>) => void;
    CheckCreate: (transaction: AccountTransaction<CheckCreate>) => void;
    Clawback: (transaction: AccountTransaction<Clawback>) => void;
    DepositPreauth: (transaction: AccountTransaction<DepositPreauth>) => void;
    EscrowCancel: (transaction: AccountTransaction<EscrowCancel>) => void;
    EscrowCreate: (transaction: AccountTransaction<EscrowCreate>) => void;
    EscrowFinish: (transaction: AccountTransaction<EscrowFinish>) => void;
    NFTokenAcceptOffer: (transaction: AccountTransaction<NFTokenAcceptOffer>) => void;
    NFTokenBurn: (transaction: AccountTransaction<NFTokenBurn>) => void;
    NFTokenCancelOffer: (transaction: AccountTransaction<NFTokenCancelOffer>) => void;
    NFTokenCreateOffer: (transaction: AccountTransaction<NFTokenCreateOffer>) => void;
    NFTokenMint: (transaction: AccountTransaction<NFTokenMint>) => void;
    OfferCancel: (transaction: AccountTransaction<OfferCancel>) => void;
    OfferCreate: (transaction: AccountTransaction<OfferCreate>) => void;
    Payment: (transaction: AccountTransaction<Payment>) => void;
    PaymentChannelClaim: (transaction: AccountTransaction<PaymentChannelClaim>) => void;
    PaymentChannelCreate: (transaction: AccountTransaction<PaymentChannelCreate>) => void;
    PaymentChannelFund: (transaction: AccountTransaction<PaymentChannelFund>) => void;
    SetRegularKey: (transaction: AccountTransaction<SetRegularKey>) => void;
    SignerListSet: (transaction: AccountTransaction<SignerListSet>) => void;
    TicketCreate: (transaction: AccountTransaction<TicketCreate>) => void;
    TrustSet: (transaction: AccountTransaction<TrustSet>) => void;
    XChainAddAccountCreateAttestation: (transaction: AccountTransaction<XChainAddAccountCreateAttestation>) => void;
    XChainAddClaimAttestation: (transaction: AccountTransaction<XChainAddClaimAttestation>) => void;
    XChainClaim: (transaction: AccountTransaction<XChainClaim>) => void;
    XChainCommit: (transaction: AccountTransaction<XChainCommit>) => void;
    XChainCreateBridge: (transaction: AccountTransaction<XChainCreateBridge>) => void;
    XChainCreateClaimID: (transaction: AccountTransaction<XChainCreateClaimID>) => void;
    XChainAccountCreateCommit: (transaction: AccountTransaction<XChainAccountCreateCommit>) => void;
    XChainModifyBridge: (transaction: AccountTransaction<XChainModifyBridge>) => void;
};
