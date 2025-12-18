import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Type, MousePointer, Contrast, X } from "lucide-react";

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [contrast, setContrast] = useState('normal');
  const [cursorSize, setCursorSize] = useState('normal');

  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontSize(settings.fontSize || 100);
      setContrast(settings.contrast || 'normal');
      setCursorSize(settings.cursorSize || 'normal');
      applySettings(settings);
    }
  }, []);

  const applySettings = (settings) => {
    document.documentElement.style.fontSize = `${settings.fontSize}%`;
    
    if (settings.contrast === 'high') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (settings.cursorSize === 'large') {
      document.documentElement.classList.add('large-cursor');
    } else {
      document.documentElement.classList.remove('large-cursor');
    }
  };

  const saveSettings = (newSettings) => {
    localStorage.setItem('accessibility', JSON.stringify(newSettings));
    applySettings(newSettings);
  };

  const changeFontSize = (delta) => {
    const newSize = Math.max(80, Math.min(150, fontSize + delta));
    setFontSize(newSize);
    saveSettings({ fontSize: newSize, contrast, cursorSize });
  };

  const toggleContrast = () => {
    const newContrast = contrast === 'normal' ? 'high' : 'normal';
    setContrast(newContrast);
    saveSettings({ fontSize, contrast: newContrast, cursorSize });
  };

  const toggleCursor = () => {
    const newCursor = cursorSize === 'normal' ? 'large' : 'normal';
    setCursorSize(newCursor);
    saveSettings({ fontSize, contrast, cursorSize: newCursor });
  };

  const resetSettings = () => {
    setFontSize(100);
    setContrast('normal');
    setCursorSize('normal');
    saveSettings({ fontSize: 100, contrast: 'normal', cursorSize: 'normal' });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 accessible-focus mobile-touch-target"
        aria-label="פתח תפריט נגישות"
        aria-expanded={isOpen}
        title="תפריט נגישות"
      >
        <Eye className="w-6 h-6 text-white" aria-hidden="true" />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-20 left-4 z-50 w-72 shadow-2xl" role="dialog" aria-labelledby="accessibility-title">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" id="accessibility-title">נגישות</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="accessible-focus mobile-touch-target"
                aria-label="סגור תפריט נגישות"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-4 h-4" />
                  <span className="text-sm font-medium">גודל טקסט</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeFontSize(-10)}
                    className="accessible-focus mobile-touch-target"
                    aria-label="הקטן טקסט"
                  >
                    A-
                  </Button>
                  <span className="flex-1 text-center text-sm py-2" role="status" aria-live="polite">{fontSize}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeFontSize(10)}
                    className="accessible-focus mobile-touch-target"
                    aria-label="הגדל טקסט"
                  >
                    A+
                  </Button>
                </div>
              </div>

              <div>
                <Button
                  variant={contrast === 'high' ? 'default' : 'outline'}
                  className="w-full justify-start accessible-focus mobile-touch-target"
                  onClick={toggleContrast}
                  aria-pressed={contrast === 'high'}
                  aria-label={contrast === 'high' ? 'כבה ניגודיות גבוהה' : 'הפעל ניגודיות גבוהה'}
                >
                  <Contrast className="w-4 h-4 ml-2" aria-hidden="true" />
                  ניגודיות גבוהה
                </Button>
              </div>

              <div>
                <Button
                  variant={cursorSize === 'large' ? 'default' : 'outline'}
                  className="w-full justify-start accessible-focus mobile-touch-target"
                  onClick={toggleCursor}
                  aria-pressed={cursorSize === 'large'}
                  aria-label={cursorSize === 'large' ? 'החזר לסמן רגיל' : 'הפעל סמן גדול'}
                >
                  <MousePointer className="w-4 h-4 ml-2" aria-hidden="true" />
                  סמן עכבר גדול
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full accessible-focus mobile-touch-target"
                onClick={resetSettings}
                aria-label="אפס את כל הגדרות הנגישות"
              >
                איפוס הגדרות
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        .high-contrast {
          filter: contrast(1.3);
        }
        
        .large-cursor * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="10" fill="black" stroke="white" stroke-width="2"/></svg>') 16 16, auto !important;
        }
      `}</style>
    </>
  );
}