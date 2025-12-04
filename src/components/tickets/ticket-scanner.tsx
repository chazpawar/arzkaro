import React, { useState } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Button from '../ui/button';
import Card from '../ui/card';
import LoadingSpinner from '../ui/loading-spinner';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, BorderRadius } from '../../constants/styles';

interface TicketScannerProps {
  onScan: (data: string) => Promise<{ valid: boolean; message: string; ticket?: any }>;
  onClose?: () => void;
}

/**
 * TicketScanner - Camera-based QR code scanner for hosts to validate tickets
 *
 * Usage:
 * <TicketScanner
 *   onScan={async (qrCode) => await validateTicket(qrCode, hostId)}
 *   onClose={() => navigation.goBack()}
 * />
 */
export default function TicketScanner({ onScan, onClose }: TicketScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    message: string;
    ticket?: any;
  } | null>(null);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanning) return;

    setScanning(true);
    setScanned(true);

    // Vibrate on scan
    Vibration.vibrate(100);

    try {
      const scanResult = await onScan(data);
      setResult(scanResult);

      // Vibrate pattern based on result
      if (scanResult.valid) {
        Vibration.vibrate([0, 100, 100, 100]); // Success pattern
      } else {
        Vibration.vibrate([0, 200, 100, 200]); // Error pattern
      }
    } catch (_error) {
      setResult({
        valid: false,
        message: 'Failed to validate ticket. Please try again.',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setResult(null);
  };

  if (!permission) {
    return <LoadingSpinner fullScreen text="Requesting camera permission..." />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>We need camera access to scan ticket QR codes.</Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          variant="primary"
          size="large"
        />
        {onClose && (
          <Button title="Go Back" onPress={onClose} variant="ghost" style={styles.closeButton} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Scanning Overlay */}
        <View style={styles.overlay}>
          {/* Top Overlay */}
          <View style={styles.overlayTop} />

          {/* Middle Row */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />

            {/* Scanner Frame */}
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {scanning && (
                <View style={styles.scanningIndicator}>
                  <LoadingSpinner size="small" color={Colors.textInverse} />
                  <Text style={styles.scanningText}>Validating...</Text>
                </View>
              )}
            </View>

            <View style={styles.overlaySide} />
          </View>

          {/* Bottom Overlay with Instructions */}
          <View style={styles.overlayBottom}>
            <Text style={styles.instructionText}>
              {scanned ? 'Processing...' : 'Point camera at ticket QR code'}
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Result Modal */}
      {result && (
        <View style={styles.resultOverlay}>
          <Card style={styles.resultCard} variant="elevated">
            <View
              style={[
                styles.resultIconContainer,
                result.valid ? styles.resultIconSuccess : styles.resultIconError,
              ]}
            >
              <Text style={styles.resultIcon}>{result.valid ? '✓' : '✗'}</Text>
            </View>

            <Text
              style={[
                styles.resultTitle,
                result.valid ? styles.resultTitleSuccess : styles.resultTitleError,
              ]}
            >
              {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}
            </Text>

            <Text style={styles.resultMessage}>{result.message}</Text>

            {result.ticket && (
              <View style={styles.ticketInfo}>
                {result.ticket.event?.title && (
                  <Text style={styles.ticketInfoText}>Event: {result.ticket.event.title}</Text>
                )}
              </View>
            )}

            <View style={styles.resultActions}>
              <Button
                title="Scan Another"
                onPress={handleScanAgain}
                variant={result.valid ? 'primary' : 'secondary'}
                style={styles.resultButton}
              />
              {onClose && (
                <Button
                  title="Close Scanner"
                  onPress={onClose}
                  variant="outline"
                  style={styles.resultButton}
                />
              )}
            </View>
          </Card>
        </View>
      )}

      {/* Close Button */}
      {onClose && !result && (
        <View style={styles.closeButtonContainer}>
          <Button title="Close" onPress={onClose} variant="secondary" size="small" />
        </View>
      )}
    </View>
  );
}

const SCANNER_SIZE = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCANNER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BorderRadius.md,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BorderRadius.md,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BorderRadius.md,
  },
  scanningIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningText: {
    ...Typography.bodyMedium,
    color: Colors.textInverse,
    marginLeft: Spacing.sm,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  instructionText: {
    ...Typography.body,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  closeButton: {
    marginTop: Spacing.md,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.lg,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  resultCard: {
    width: '100%',
    maxWidth: 340,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  resultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resultIconSuccess: {
    backgroundColor: Colors.successLight,
  },
  resultIconError: {
    backgroundColor: Colors.errorLight,
  },
  resultIcon: {
    fontSize: 40,
    color: Colors.text,
  },
  resultTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  resultTitleSuccess: {
    color: Colors.success,
  },
  resultTitleError: {
    color: Colors.error,
  },
  resultMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  ticketInfo: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  ticketInfoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resultActions: {
    width: '100%',
    gap: Spacing.sm,
  },
  resultButton: {
    width: '100%',
  },
});
