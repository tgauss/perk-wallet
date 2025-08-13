'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { AppleDoctorResponse, DoctorItem, DoctorStatus } from '@/app/api/admin/apple/doctor/route';

function StatusBadge({ status }: { status: DoctorStatus }) {
  if (status === 'ok') {
    return (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="mr-1 h-3 w-3" />
        OK
      </Badge>
    );
  }
  if (status === 'warn') {
    return (
      <Badge variant="secondary" className="bg-yellow-500 text-white">
        <AlertCircle className="mr-1 h-3 w-3" />
        WARN
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" />
      FAIL
    </Badge>
  );
}

function DoctorSection({ title, items }: { title: string; items: DoctorItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.details}</div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AppleCheckPage() {
  const [data, setData] = useState<AppleDoctorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/apple/doctor');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const downloadTestPass = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/admin/apple/doctor/pkpass', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate test pass');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'doctor-test.pkpass';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download test pass');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Apple Wallet Doctor</CardTitle>
            <CardDescription>Error loading doctor data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-destructive">{error}</div>
            <Button onClick={fetchDoctorData} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const allOk = Object.values(data.sections).every(section =>
    section.every(item => item.status === 'ok')
  );

  const hasWarnings = Object.values(data.sections).some(section =>
    section.some(item => item.status === 'warn')
  );

  const hasFailures = Object.values(data.sections).some(section =>
    section.some(item => item.status === 'fail')
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Apple Wallet Doctor</h1>
        <p className="text-muted-foreground">
          Validates Apple Wallet configuration and certificate setup
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Button onClick={fetchDoctorData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Run Again
        </Button>
        <Button onClick={downloadTestPass} disabled={downloading || hasFailures}>
          <Download className="mr-2 h-4 w-4" />
          {downloading ? 'Generating...' : 'Download Test .pkpass'}
        </Button>
        
        <div className="ml-auto flex items-center gap-2">
          {allOk && (
            <Badge variant="default" className="bg-green-500">
              All Checks Passed
            </Badge>
          )}
          {hasWarnings && !hasFailures && (
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              Some Warnings
            </Badge>
          )}
          {hasFailures && (
            <Badge variant="destructive">
              Some Checks Failed
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            Last run: {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        <DoctorSection title="Environment Variables" items={data.sections.env} />
        <DoctorSection title="Certificate" items={data.sections.certificate} />
        <DoctorSection title="Signing Test" items={data.sections.signing} />
        <DoctorSection title="Routes" items={data.sections.routes} />
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          This doctor validates your Apple Wallet setup without making any network calls to Apple.
          The test pass can be opened in Apple Wallet to verify signing works correctly.
        </p>
      </div>
    </div>
  );
}