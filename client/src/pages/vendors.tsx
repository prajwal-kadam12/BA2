
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useOrganization } from "@/context/OrganizationContext";
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
import { formatCurrency } from "@/lib/utils";
import { robustIframePrint } from "@/lib/robust-print";

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

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
                    <TabsList className="h-auto p-0 bg-transparent gap-2">
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
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 py-3 gap-2"
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="overview" className="flex-1 overflow-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    <div className="flex-1 overflow-auto p-6">
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
            </Tabs>
        </div>
    );
}
import { X } from "lucide-react";

export default function VendorsPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

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
            <ResizablePanelGroup direction="horizontal" className="h-full w-full" autoSaveId="vendors-layout">
                <ResizablePanel
                    defaultSize={selectedVendor ? 30 : 100}
                    minSize={30}
                    className="flex flex-col overflow-hidden bg-white border-r border-slate-200"
                >
                    <div className="flex flex-col h-full overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10 h-[73px]">
                            <div className="flex items-center gap-4 flex-1">
                                <h1 className="text-xl font-semibold text-slate-900">All Vendors</h1>

                                <div className="relative flex-1 max-w-[240px] hidden sm:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search vendors..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button onClick={() => setLocation("/vendors/new")} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" /> New Vendor
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-auto">
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
                                                <th className="px-3 py-3 text-left font-semibold text-slate-500">NAME</th>
                                                <th className="px-3 py-3 text-left font-semibold text-slate-500">COMPANY</th>
                                                <th className="px-3 py-3 text-left font-semibold text-slate-500">EMAIL</th>
                                                <th className="px-3 py-3 text-left font-semibold text-slate-500">PHONE</th>
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

                            {/* Pagination - Sticky Bottom */}
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
                        <ResizablePanel defaultSize={70} minSize={30} className="bg-white">
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this vendor?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
