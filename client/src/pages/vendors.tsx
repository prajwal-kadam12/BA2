
import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
import { cn } from "@/lib/utils";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    ChevronDown,
    Mail,
    Phone,
    MapPin,
    Building2,
    FileText,
    Filter,
    ArrowUpDown,
    ChevronUp,
    X,
    Send,
    Printer,
    Download,
    MessageSquare,
    History,
    Receipt,
    BadgeIndianRupee,
    Settings,
    Clock,
    User,
    CreditCard,
    Briefcase,
    Notebook,
    ChevronRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { TablePagination } from "@/components/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
// removed import { formatCurrency } from "@/lib/utils";
import { robustIframePrint } from "@/lib/robust-print";
import { generatePDFFromElement } from "@/lib/pdf-utils";

interface Vendor {
    id: string;
    name: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    gstTreatment?: string;
    currency?: string;
    openingBalance?: number;
    paymentTerms?: string;
    sourceOfSupply?: string;
    billingAddress?: {
        street1?: string;
        street2?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        country?: string;
    };
    shippingAddress?: {
        street1?: string;
        street2?: string;
        city?: string;
        state?: string;
        pinCode?: string;
        country?: string;
    };
    payables?: number;
    unusedCredits?: number;
    status?: string;
    createdAt?: string;
}

interface Comment {
    id: string;
    text: string;
    author: string;
    createdAt: string;
}

interface Transaction {
    id: string;
    type: string;
    date: string;
    number: string;
    orderNumber?: string;
    amount: number;
    balance: number;
    status: string;
    vendor?: string;
    paidThrough?: string;
}

interface SystemMail {
    id: string;
    to: string;
    subject: string;
    date: string;
    status: string;
    type: string;
}

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    description: string;
    user: string;
    date: string;
    time: string;
}

interface VendorDetailPanelProps {
    vendor: Vendor;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function VendorDetailPanel({ vendor, onClose, onEdit, onDelete }: VendorDetailPanelProps) {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({
        bills: [],
        billPayments: [],
        expenses: [],
        purchaseOrders: [],
        vendorCredits: [],
        journals: []
    });
    const [mails, setMails] = useState<SystemMail[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        bills: true,
        billPayments: true,
        expenses: false,
        purchaseOrders: false,
        vendorCredits: false
    });

    useEffect(() => {
        if (vendor.id) {
            fetchVendorData();
        }
    }, [vendor.id]);

    const fetchVendorData = async () => {
        setLoading(true);
        try {
            const [commentsRes, transactionsRes, mailsRes, activitiesRes] = await Promise.all([
                fetch(`/api/vendors/${vendor.id}/comments`),
                fetch(`/api/vendors/${vendor.id}/transactions`),
                fetch(`/api/vendors/${vendor.id}/mails`),
                fetch(`/api/vendors/${vendor.id}/activities`)
            ]);

            if (commentsRes.ok) {
                const data = await commentsRes.json();
                setComments(data.data || []);
            }
            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data.data || {
                    bills: [],
                    billPayments: [],
                    expenses: [],
                    purchaseOrders: [],
                    vendorCredits: [],
                    journals: []
                });
            }
            if (mailsRes.ok) {
                const data = await mailsRes.json();
                setMails(data.data || []);
            }
            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                setActivities(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching vendor data:', error);
            toast({ title: "Failed to fetch vendor data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            const response = await fetch(`/api/vendors/${vendor.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newComment })
            });
            if (response.ok) {
                const data = await response.json();
                setComments([...comments, data.data]);
                setNewComment("");
                toast({ title: "Comment added successfully" });
            }
        } catch (error) {
            toast({ title: "Failed to add comment", variant: "destructive" });
        }
    };

    const handlePrint = () => {
        robustIframePrint("vendor-statement");
    };

    const handleDownloadPDF = async () => {
        toast({ title: "Preparing download...", description: "Please wait while we generate your PDF." });
        try {
            await generatePDFFromElement("vendor-statement", `Statement-${vendor.name}.pdf`);
            toast({ title: "Success", description: "Statement downloaded successfully." });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections((prev: Record<string, boolean>) => ({ ...prev, [section]: !prev[section] }));
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate">
                        {vendor.displayName || vendor.name}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9">
                                <Plus className="h-4 w-4" />
                                New Transaction
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setLocation(`/bills/create?vendorId=${vendor.id}`)}>
                                <Receipt className="mr-2 h-4 w-4" /> Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/expenses/create?vendorId=${vendor.id}`)}>
                                <BadgeIndianRupee className="mr-2 h-4 w-4" /> Expense
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/purchase-orders/create?vendorId=${vendor.id}`)}>
                                <Briefcase className="mr-2 h-4 w-4" /> Purchase Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/payments-made/create?vendorId=${vendor.id}`)}>
                                <CreditCard className="mr-2 h-4 w-4" /> Payment Made
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/vendor-credits/create?vendorId=${vendor.id}`)}>
                                <Notebook className="mr-2 h-4 w-4" /> Vendor Credit
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="sm" onClick={onEdit} className="h-9">
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 h-9">
                                More
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onDelete} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
                    <TabsList className="h-auto p-0 bg-transparent gap-6">
                        {[
                            { value: "overview", label: "Overview", icon: Building2 },
                            { value: "comments", label: "Comments", icon: MessageSquare },
                            { value: "transactions", label: "Transactions", icon: History },
                            { value: "mails", label: "Mails", icon: Mail },
                            { value: "statement", label: "Statement", icon: FileText }
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent hover:bg-transparent transition-none gap-2"
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="overview" className="flex-1 overflow-auto scrollbar-hide p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Basic Info Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-slate-900 dark:text-white">Vendor Information</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Vendor Name</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{vendor.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Display Name</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{vendor.displayName || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Company Name</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{vendor.companyName || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">GSTIN</p>
                                        <p className="text-sm font-medium text-blue-600 mt-1 uppercase">{vendor.gstin || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">GST Treatment</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{vendor.gstTreatment || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Currency</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{vendor.currency || 'INR'}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Email</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{vendor.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Phone</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{vendor.phone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payables Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BadgeIndianRupee className="h-5 w-5 text-green-600" />
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Payables & Balances</h3>
                                </div>
                                <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-none">Active</Badge>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                                        <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase mb-1">Total Payables</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(vendor.payables || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Unused Credits</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(vendor.unusedCredits || 0)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500">Opening Balance</span>
                                        <span className="font-medium">{formatCurrency(vendor.openingBalance || 0)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-slate-500">Payment Terms</span>
                                        <span className="font-medium text-blue-600">{vendor.paymentTerms || 'Due on Receipt'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Addresses Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
                            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-red-600" />
                                <h3 className="font-semibold text-slate-900 dark:text-white">Addresses</h3>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Address</h4>
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-600">Copy to Shipping</Button>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg min-h-[100px]">
                                        {vendor.billingAddress?.street1 || vendor.billingAddress?.street2 || vendor.billingAddress?.city ? (
                                            <>
                                                <p className="font-medium text-slate-900 dark:text-slate-200">{vendor.name}</p>
                                                <p>{vendor.billingAddress.street1}</p>
                                                {vendor.billingAddress.street2 && <p>{vendor.billingAddress.street2}</p>}
                                                <p>{vendor.billingAddress.city}, {vendor.billingAddress.state} - {vendor.billingAddress.pinCode}</p>
                                                <p>{vendor.billingAddress.country}</p>
                                            </>
                                        ) : (
                                            <p className="text-slate-400 italic">No billing address specified</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shipping Address</h4>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg min-h-[100px]">
                                        {vendor.shippingAddress?.street1 || vendor.shippingAddress?.street2 || vendor.shippingAddress?.city ? (
                                            <>
                                                <p className="font-medium text-slate-900 dark:text-slate-200">{vendor.name}</p>
                                                <p>{vendor.shippingAddress.street1}</p>
                                                {vendor.shippingAddress.street2 && <p>{vendor.shippingAddress.street2}</p>}
                                                <p>{vendor.shippingAddress.city}, {vendor.shippingAddress.state} - {vendor.shippingAddress.pinCode}</p>
                                                <p>{vendor.shippingAddress.country}</p>
                                            </>
                                        ) : (
                                            <p className="text-slate-400 italic">No shipping address specified</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="comments" className="flex-1 overflow-hidden flex flex-col p-0">
                    <div className="flex-1 overflow-auto scrollbar-hide p-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {comments.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No comments yet</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Add notes or internal comments about this vendor to keep your team informed.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 px-2">Recent Comments</h3>
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-lg flex-none">
                                                    {comment.author.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-slate-900 dark:text-white">{comment.author}</span>
                                                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative group">
                                <Textarea
                                    placeholder="Type a comment or internal note..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl p-4 pr-16 text-sm resize-none shadow-inner"
                                />
                                <Button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    className="absolute right-3 bottom-3 h-10 w-10 rounded-lg p-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="transactions" className="flex-1 overflow-auto scrollbar-hide p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" data-vendor-transactions-scroll-container>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Fetching transaction history...</p>
                        </div>
                    ) : (
                        <>
                            {/* Go to transactions dropdown */}
                            <div className="flex items-center justify-between mb-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            Go to transactions
                                            <ChevronDown className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        {[
                                            { id: 'bills', label: 'Bills' },
                                            { id: 'billPayments', label: 'Payments Made' },
                                            { id: 'expenses', label: 'Expenses' },
                                            { id: 'purchaseOrders', label: 'Purchase Orders' },
                                            { id: 'vendorCredits', label: 'Vendor Credits' }
                                        ].map((section) => (
                                            <DropdownMenuItem
                                                key={section.id}
                                                onClick={() => {
                                                    // First expand the section
                                                    setExpandedSections((prev: Record<string, boolean>) => ({ ...prev, [section.id]: true }));
                                                    // Use timeout to allow section to expand fully
                                                    setTimeout(() => {
                                                        const element = document.getElementById(`vendor-section-${section.id}`);
                                                        const scrollContainer = document.querySelector('[data-vendor-transactions-scroll-container]');
                                                        if (element && scrollContainer) {
                                                            // Get the parent container's padding/offset (the div with p-6 = 24px)
                                                            const containerPadding = 24;
                                                            // Calculate scroll position - element's position relative to container
                                                            const elementTop = element.offsetTop;

                                                            scrollContainer.scrollTo({
                                                                top: elementTop - containerPadding - 60, // 60px offset for the dropdown header
                                                                behavior: 'smooth'
                                                            });
                                                        } else if (element) {
                                                            element.scrollIntoView({
                                                                behavior: 'smooth',
                                                                block: 'start'
                                                            });
                                                        }
                                                    }, 300);
                                                }}
                                            >
                                                {section.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { id: 'bills', label: 'Bills', icon: Receipt, count: transactions.bills.length, items: transactions.bills },
                                    { id: 'billPayments', label: 'Payments Made', icon: CreditCard, count: transactions.billPayments.length, items: transactions.billPayments },
                                    { id: 'expenses', label: 'Expenses', icon: BadgeIndianRupee, count: transactions.expenses.length, items: transactions.expenses },
                                    { id: 'purchaseOrders', label: 'Purchase Orders', icon: Briefcase, count: transactions.purchaseOrders.length, items: transactions.purchaseOrders },
                                    { id: 'vendorCredits', label: 'Vendor Credits', icon: Notebook, count: transactions.vendorCredits.length, items: transactions.vendorCredits }
                                ].map((section) => (
                                    <Collapsible
                                        key={section.id}
                                        open={expandedSections[section.id]}
                                        onOpenChange={() => toggleSection(section.id)}
                                    >
                                        <div id={`vendor-section-${section.id}`} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                            <CollapsibleTrigger asChild>
                                                <div className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${section.count > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'}`}>
                                                            <section.icon className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{section.label}</h4>
                                                            <p className="text-xs text-slate-500">{section.count} {section.count === 1 ? 'record' : 'records'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {section.count > 0 && <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 hidden sm:inline-flex">View All</Badge>}
                                                        <div className={`p-1 rounded-md bg-slate-100 dark:bg-slate-700 transition-transform duration-200 ${expandedSections[section.id] ? 'rotate-180' : ''}`}>
                                                            <ChevronDown className="h-4 w-4 text-slate-500" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
                                                    {section.items.length === 0 ? (
                                                        <div className="px-5 py-8 text-center bg-slate-50/30 dark:bg-slate-900/10">
                                                            <p className="text-sm text-slate-400">No {section.label.toLowerCase()} found for this period.</p>
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                                                    <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                                    <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Number</th>
                                                                    <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                                    <th className="px-5 py-2.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                                                    <th className="px-5 py-2.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Balance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                                {section.items.map((item) => (
                                                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors group" onClick={() => {
                                                                        const basePath = section.id === 'billPayments' ? 'payments-made' :
                                                                            section.id === 'vendorCredits' ? 'vendor-credits' :
                                                                                section.id === 'purchaseOrders' ? 'purchase-orders' :
                                                                                    section.id;
                                                                        setLocation(`/${basePath}?id=${item.id}`);
                                                                    }}>
                                                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{formatDate(item.date)}</td>
                                                                        <td className="px-5 py-3 text-blue-600 font-semibold group-hover:underline decoration-blue-300 underline-offset-4">{item.number}</td>
                                                                        <td className="px-5 py-3">
                                                                            <Badge variant="outline" className={`
                                                                        ${item.status === 'Paid' || item.status === 'Sent' || item.status === 'Closed' ? 'bg-green-50 text-green-600 border-green-200' : ''}
                                                                        ${item.status === 'Partially Paid' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : ''}
                                                                        ${item.status === 'Open' || item.status === 'Draft' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                                                                        ${item.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                                                                    `}>
                                                                                {item.status}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(item.amount)}</td>
                                                                        <td className="px-5 py-3 text-right font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatCurrency(item.balance)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </CollapsibleContent>
                                        </div>
                                    </Collapsible>
                                ))}
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="mails" className="flex-1 overflow-auto scrollbar-hide p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-600" />
                                Communication History
                            </h3>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Send className="h-4 w-4" /> Send Email
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                                <p className="text-slate-500">Loading mails...</p>
                            </div>
                        ) : mails.length === 0 ? (
                            <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No mails sent yet</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mt-1">When you send statements, bills, or receipts to this vendor, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mails.map((mail) => (
                                    <div key={mail.id} className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{mail.subject}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <User className="h-3 w-3" /> To: {mail.to}
                                                        </span>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {formatDate(mail.date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={`
                                                ${mail.status === 'Sent' || mail.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'}
                                            `}>
                                                {mail.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="statement" className="flex-1 overflow-hidden flex flex-col p-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-none p-4 px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Filter className="h-4 w-4" /> This Month
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem>This Month</DropdownMenuItem>
                                    <DropdownMenuItem>Last Month</DropdownMenuItem>
                                    <DropdownMenuItem>This Quarter</DropdownMenuItem>
                                    <DropdownMenuItem>Last Quarter</DropdownMenuItem>
                                    <DropdownMenuItem>Financial Year</DropdownMenuItem>
                                    <DropdownMenuItem>Custom Range</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
                                <Printer className="h-4 w-4" /> Print
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
                                <Download className="h-4 w-4" /> PDF
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm">
                                <Send className="h-4 w-4" /> Send Email
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-hide bg-slate-100 dark:bg-slate-900/90 p-4 md:p-8 flex justify-center">
                        <div
                            id="vendor-statement"
                            className="bg-white dark:bg-white text-slate-900 shadow-xl px-8 md:px-10 py-10 w-full max-w-[210mm] min-h-[296mm] h-fit flex flex-col"
                            style={{ color: '#000000' }}
                        >
                            <div className="flex justify-between items-start mb-12 border-b border-slate-200 pb-10">
                                <div>
                                    <h1 className="text-4xl font-light text-slate-400 uppercase tracking-widest mb-2">Statement</h1>
                                    <div className="space-y-1 text-sm text-slate-600">
                                        <p><span className="text-slate-400 uppercase font-medium">Period:</span> 01 Jan 2026 - 31 Jan 2026</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-bold uppercase text-slate-900">ACME Corporation</h2>
                                    <p className="text-sm text-slate-600 mt-1">Maharashtra, India</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-12">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">To:</h3>
                                    <p className="font-bold text-lg text-slate-900 mb-1">{vendor.name}</p>
                                    <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                        {vendor.billingAddress?.street1}<br />
                                        {vendor.billingAddress?.city}, {vendor.billingAddress?.state}<br />
                                        {vendor.billingAddress?.pinCode}
                                    </p>
                                </div>
                                <div>
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Account Summary</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Opening Balance</span>
                                                <span className="font-semibold text-slate-900">{formatCurrency(vendor.openingBalance || 0)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-blue-600 font-bold border-t border-slate-200 pt-2 mt-2">
                                                <span className="uppercase text-[11px] tracking-tight">Current Balance</span>
                                                <span className="text-lg">{formatCurrency(vendor.payables || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full text-sm mb-8 flex-1">
                                <thead>
                                    <tr className="border-b-2 border-slate-900 text-slate-900">
                                        <th className="py-3 text-left font-bold uppercase tracking-wider text-[11px]">Date</th>
                                        <th className="py-3 text-left font-bold uppercase tracking-wider text-[11px]">Description</th>
                                        <th className="py-3 text-right font-bold uppercase tracking-wider text-[11px]">Credits</th>
                                        <th className="py-3 text-right font-bold uppercase tracking-wider text-[11px]">Debits</th>
                                        <th className="py-3 text-right font-bold uppercase tracking-wider text-[11px]">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    <tr className="bg-slate-50/50">
                                        <td className="py-4 italic font-medium">01/01/2026</td>
                                        <td className="py-4 font-bold text-slate-600">Opening Balance</td>
                                        <td className="py-4 text-right font-medium">-</td>
                                        <td className="py-4 text-right font-medium">-</td>
                                        <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(vendor.openingBalance || 0)}</td>
                                    </tr>
                                    {transactions.bills.slice(0, 8).map((bill) => (
                                        <tr key={bill.id}>
                                            <td className="py-4 font-medium text-slate-600">{formatDate(bill.date)}</td>
                                            <td className="py-4">
                                                <p className="font-bold text-slate-900">Bill: {bill.number}</p>
                                                <p className="text-[11px] text-slate-500 font-medium">Purchase Order: {bill.orderNumber || 'N/A'}</p>
                                            </td>
                                            <td className="py-4 text-right font-bold text-red-600">{formatCurrency(bill.amount)}</td>
                                            <td className="py-4 text-right font-medium">-</td>
                                            <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(bill.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="border-t-2 border-slate-900 pt-6 mt-auto flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight text-[11px]">Total Purchases</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(transactions.bills.reduce((acc, b) => acc + b.amount, 0))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight text-[11px]">Total Payments</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(transactions.billPayments.reduce((acc, p) => acc + p.amount, 0))}</span>
                                    </div>
                                    <div className="flex justify-between pt-4 border-t border-slate-200">
                                        <span className="text-lg font-black uppercase tracking-tighter text-blue-600">Balance Due</span>
                                        <span className="text-2xl font-black text-blue-600">{formatCurrency(vendor.payables || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-bold">
                                This is a computer generated document.
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function VendorsPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const isMobile = useIsMobile();
    const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await fetch('/api/vendors');
            if (response.ok) {
                const data = await response.json();
                setVendors(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVendorClick = (vendor: Vendor) => {
        setSelectedVendor(vendor);
    };

    const handleClosePanel = () => {
        setSelectedVendor(null);
    };

    const handleEditVendor = () => {
        if (selectedVendor) {
            setLocation(`/vendors/${selectedVendor.id}/edit`);
        }
    };

    const handleDeleteClick = () => {
        if (selectedVendor) {
            setVendorToDelete(selectedVendor.id);
            setDeleteDialogOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!vendorToDelete) return;
        try {
            const response = await fetch(`/api/vendors/${vendorToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                toast({ title: "Vendor deleted successfully" });
                handleClosePanel();
                fetchVendors();
            }
        } catch (error) {
            toast({ title: "Failed to delete vendor", variant: "destructive" });
        } finally {
            setDeleteDialogOpen(false);
            setVendorToDelete(null);
        }
    };

    const filteredVendors = vendors.filter(vendor =>
        (vendor.displayName || vendor.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const { currentPage, totalPages, totalItems, itemsPerPage, paginatedItems, goToPage } = usePagination(filteredVendors, 10);

    const toggleSelectVendor = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedVendors.includes(id)) {
            setSelectedVendors(selectedVendors.filter(i => i !== id));
        } else {
            setSelectedVendors([...selectedVendors, id]);
        }
    }

    return (
        <div className="flex h-screen animate-in fade-in duration-300 w-full overflow-hidden bg-slate-50">
            {isMobile ? (
                // Mobile View: Switch between list and detail
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {selectedVendor ? (
                        <VendorDetailPanel
                            vendor={selectedVendor}
                            onClose={handleClosePanel}
                            onEdit={handleEditVendor}
                            onDelete={handleDeleteClick}
                        />
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Mobile Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
                                <h1 className="text-xl font-semibold text-slate-900">All Vendors</h1>
                                <Button onClick={() => setLocation("/vendors/new")} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" /> New
                                </Button>
                            </div>

                            {/* Mobile Search */}
                            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search vendors..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9 bg-white"
                                    />
                                </div>
                            </div>

                            {/* Mobile List Content */}
                            <div className="flex-1 overflow-auto scrollbar-hide">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-500">Loading vendors...</div>
                                ) : filteredVendors.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">No vendors found.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {paginatedItems.map(vendor => (
                                            <div
                                                key={vendor.id}
                                                className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                                onClick={() => handleVendorClick(vendor)}
                                            >
                                                <div>
                                                    <div className="font-medium text-blue-600">{vendor.displayName || vendor.name}</div>
                                                    <div className="text-sm text-slate-500">{vendor.companyName || '-'}</div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Pagination */}
                            {filteredVendors.length > 0 && (
                                <div className="border-t border-slate-200">
                                    <TablePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={goToPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                // Desktop View: Resizable side-by-side panels
                <ResizablePanelGroup key={selectedVendor ? "split" : "single"} direction="horizontal" className="h-full w-full">
                    <ResizablePanel
                        defaultSize={selectedVendor ? 29 : 100}
                        minSize={selectedVendor ? 29 : 100}
                        maxSize={selectedVendor ? 29 : 100}
                        className="flex flex-col overflow-hidden bg-white border-r border-slate-200 min-w-[25%]"
                    >
                        <div className="flex flex-col h-full overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 min-h-[73px] h-auto">
                                <div className="flex items-center gap-4 flex-1">
                                    <h1 className="text-xl font-semibold text-slate-900 line-clamp-2">All Vendors</h1>
                                    <span className="text-sm text-slate-400">({vendors.length})</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedVendor ? (
                                        isSearchVisible ? (
                                            <div className="relative w-full max-w-[200px] animate-in slide-in-from-right-5 fade-in-0 duration-200">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    autoFocus
                                                    placeholder="Search..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onBlur={() => !searchTerm && setIsSearchVisible(false)}
                                                    className="pl-9 h-9"
                                                />
                                            </div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 px-0"
                                                data-testid="button-search-compact"
                                                onClick={() => setIsSearchVisible(true)}
                                            >
                                                <Search className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        )
                                    ) : (
                                        <div className="relative w-[240px] hidden sm:block">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search vendors..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => setLocation("/vendors/new")}
                                        className={cn(
                                            "bg-blue-600 hover:bg-blue-700 h-9",
                                            selectedVendor ? 'w-9 px-0' : 'gap-2'
                                        )}
                                        size={selectedVendor ? "icon" : "default"}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {!selectedVendor && "New"}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Import Vendors</DropdownMenuItem>
                                            <DropdownMenuItem>Export Vendors</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>Refresh List</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex-1 overflow-auto scrollbar-hide">
                                    {loading ? (
                                        <div className="p-8 text-center text-slate-500">Loading vendors...</div>
                                    ) : filteredVendors.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">No vendors found.</div>
                                    ) : selectedVendor ? (
                                        <div className="divide-y divide-slate-100">
                                            {filteredVendors.map(vendor => (
                                                <div
                                                    key={vendor.id}
                                                    className={`p-4 hover:bg-slate-50 cursor-pointer ${selectedVendor.id === vendor.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
                                                    onClick={() => handleVendorClick(vendor)}
                                                >
                                                    <div className="font-medium text-slate-900">{vendor.displayName || vendor.name}</div>
                                                    <div className="text-sm text-slate-500">{vendor.companyName}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 sticky top-0 z-10">
                                                <tr className="border-b border-slate-200">
                                                    <th className="w-10 px-3 py-3 text-left">
                                                        <Checkbox />
                                                    </th>
                                                    <th className="px-3 py-3 text-left font-semibold">Name</th>
                                                    <th className="px-3 py-3 text-left font-semibold">Company</th>
                                                    <th className="px-3 py-3 text-left font-semibold">Email</th>
                                                    <th className="px-3 py-3 text-left font-semibold">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {paginatedItems.map(vendor => (
                                                    <tr
                                                        key={vendor.id}
                                                        className="hover:bg-slate-50 cursor-pointer"
                                                        onClick={() => handleVendorClick(vendor)}
                                                    >
                                                        <td className="px-3 py-3"><Checkbox onClick={e => toggleSelectVendor(vendor.id, e)} /></td>
                                                        <td className="px-3 py-3 font-medium text-blue-600">{vendor.displayName || vendor.name}</td>
                                                        <td className="px-3 py-3 text-slate-600">{vendor.companyName || '-'}</td>
                                                        <td className="px-3 py-3 text-slate-600">{vendor.email || '-'}</td>
                                                        <td className="px-3 py-3 text-slate-600">{vendor.phone || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <div className="flex-none border-t border-slate-200 bg-white">
                                    <TablePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={goToPage}
                                    />
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    {selectedVendor && (
                        <>
                            <ResizableHandle withHandle className="w-1 bg-slate-200 hover:bg-blue-400 hover:w-1.5 transition-all cursor-col-resize" />
                            <ResizablePanel defaultSize={65} minSize={30} className="bg-white">
                                <VendorDetailPanel
                                    vendor={selectedVendor}
                                    onClose={handleClosePanel}
                                    onEdit={handleEditVendor}
                                    onDelete={handleDeleteClick}
                                />
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this vendor? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
