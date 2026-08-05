import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/services/api";

const VerifyCertificatePage = () => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/certificates/verify/${certificateId}`)
      .then((res) => setCertificate(res.data))
      .catch((err) => setError(err.response?.data?.message || "Certificate not found"))
      .finally(() => setLoading(false));
  }, [certificateId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">Certificate Verification</h1>

      {loading && <p className="text-center text-muted-foreground">Verifying...</p>}

      {!loading && error && (
        <Card className="border-destructive">
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-destructive font-medium">Invalid Certificate</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && certificate && (
        <Card className="border-gold">
          <CardContent className="p-8 space-y-4 text-center">
            <p className="text-sm text-green-600 font-medium">✓ Valid Certificate</p>
            <div>
              <p className="text-xl font-semibold">{certificate.studentName}</p>
              <p className="text-muted-foreground">has successfully completed</p>
              <p className="text-lg font-medium mt-1">{certificate.courseTitle}</p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
              <p>Certificate ID: {certificate.certificateId}</p>
              <p>Completion Date: {new Date(certificate.completionDate).toLocaleDateString()}</p>
              <p>Issued: {new Date(certificate.issuedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerifyCertificatePage;
