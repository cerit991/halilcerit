"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { InvoiceDialog } from "@/components/invoice-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApi } from "@/lib/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"

interface Invoice {
  id: string
  number: string
  type: 'sale' | 'purchase'
  date: string
  customer: {
    name: string
  }
  total: number
  status: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [invoiceType, setInvoiceType] = useState<"sale" | "purchase">("sale")
  const { fetchApi, loading } = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const data = await fetchApi('invoices')
      setInvoices(data)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Faturalar yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleInvoiceAdded = async () => {
    await loadInvoices()
    setIsDialogOpen(false)
    toast({
      title: "Başarılı",
      description: "Yeni fatura başarıyla oluşturuldu",
    })
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Faturalar</h1>
        <div className="flex space-x-2">
          <Select value={invoiceType} onValueChange={(value: "sale" | "purchase") => setInvoiceType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Fatura tipi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Satış Faturası</SelectItem>
              <SelectItem value="purchase">Alış Faturası</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsDialogOpen(true)}>
            Yeni Fatura Oluştur
          </Button>
        </div>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Fatura ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura No</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Müşteri/Tedarikçi</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Yükleniyor...</TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Kayıt bulunamadı</TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.type === "sale" ? "default" : "secondary"}>
                      {invoice.type === "sale" ? "Satış" : "Alış"}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.customer.name}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell className="text-right">
                    ₺{invoice.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                      {invoice.status === "paid" ? "Ödendi" : "Beklemede"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InvoiceDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        type={invoiceType}
        onSuccess={handleInvoiceAdded}
      />
    </div>
  )
}