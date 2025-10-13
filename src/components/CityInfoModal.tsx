import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, TrendingUp, TrendingDown, Globe, GraduationCap, DollarSign, Heart, ExternalLink } from 'lucide-react';
import { CityData } from '@/data/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QRCodeCanvas } from "qrcode.react";


interface CityInfoModalProps {
  city: CityData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CityInfoModal = ({ city, isOpen, onClose }: CityInfoModalProps) => {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();

  // URL do IBGE para mais informações
  const ibgeUrl = city ? `https://cidades.ibge.gov.br/panorama-impresso?cod=${city.codigo_ibge}` : '';

  // Gerar QR Code
  useEffect(() => {
    if (qrCodeRef.current && city?.codigo_ibge) {
      QRCode.toCanvas(qrCodeRef.current, ibgeUrl, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    }
  }, [ibgeUrl, city?.codigo_ibge]);

  if (!city) return null;

  // Calcular variação populacional
  const populationChange = city.populacao_estimada_censo_2024 - city.populacao_estimada_censo_2022;
  const populationChangePercent = city.populacao_estimada_censo_2022 > 0 
    ? ((populationChange / city.populacao_estimada_censo_2022) * 100) 
    : 0;

  const isPositiveChange = populationChangePercent > 0;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto z-[9999] bg-background border border-border`}>
        <DialogHeader className="bg-background border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {city.nome}
            <Badge variant="secondary" className="ml-2">
              {city.estado}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Gentílico: {city.gentilico}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Área Territorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-blue-600">
                  {city.area_territorial_km2.toLocaleString('pt-BR')} km²
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Densidade Demográfica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-purple-600">
                  {city.densidade_demografica_2022.toLocaleString('pt-BR')} hab/km²
                </p>
                <p className="text-xs text-muted-foreground">
                  Censo 2022
                </p>
              </CardContent>
            </Card>
          </div>

          {/* População */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                População Estimada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Censo 2022</p>
                  <p className="text-lg font-bold">
                    {city.populacao_estimada_censo_2022.toLocaleString('pt-BR')} hab
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Censo 2024</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">
                      {city.populacao_estimada_censo_2024.toLocaleString('pt-BR')} hab
                    </p>
                    {populationChangePercent !== 0 && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isPositiveChange 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {isPositiveChange ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(populationChangePercent).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicadores Sociais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-teal-500" />
                  Escolarização (6-14 anos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-teal-600">
                  {city.escolarizacao_6a14_2022.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Dados de 2022
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-orange-500" />
                  IDHM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-orange-600">
                  {city.idhm_2010.toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Índice de Desenvolvimento Humano Municipal (2010)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Economia */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                PIB per Capita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-yellow-600">
                R$ {city.pib_per_capita_2020.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">
                Dados de 2020
              </p>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Fonte dos dados:</strong> IBGE - Instituto Brasileiro de Geografia e Estatística</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações IBGE */}
          {city.codigo_ibge && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Para mais informações:</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => window.open(ibgeUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Clique aqui
                    </Button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-muted-foreground">Ou escaneie o QR Code:</p>
                    <QRCodeCanvas 
                      value={ibgeUrl} 
                      size={200} 
                      bgColor="#ffffff" 
                      fgColor="#000000" 
                      includeMargin={false}
                      className="border border-border rounded-md"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};