import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Heart, Lightbulb, PawPrint, RotateCcw, Sparkles } from 'lucide-react-native';
import { analyzeCompatibility, type CompatibilityInput, type CompatibilityResult } from '@/services/compatibilityApi';
import { colors } from '@/theme/colors';

type Step = 'adopter' | 'pet' | 'result';
type AdopterField = keyof CompatibilityInput['adopter'];
type PetField = keyof CompatibilityInput['pet'];

const emptyAdopter: CompatibilityInput['adopter'] = {
  livingSpace: '', experience: '', timeAvailable: '', familyComposition: '', lifestyle: '',
};
const emptyPet: CompatibilityInput['pet'] = {
  type: '', breed: '', temperament: '', energy: '', specialNeeds: '', description: '',
};

const livingSpaces = [
  ['apartamento pequeno', 'Apartamento pequeno'],
  ['apartamento medio', 'Apartamento médio'],
  ['apartamento grande', 'Apartamento grande'],
  ['casa pequena', 'Casa com quintal pequeno'],
  ['casa grande', 'Casa com quintal grande'],
  ['sitio', 'Sítio ou chácara'],
];
const experiences = [
  ['primeira vez', 'Primeira adoção'], ['pouca', 'Pouca experiência'],
  ['moderada', 'Experiência moderada'], ['ampla', 'Ampla experiência'],
];
const availabilities = [
  ['menos 1 hora', 'Menos de 1 h'], ['1-2 horas', '1 a 2 h'],
  ['2-4 horas', '2 a 4 h'], ['mais 4 horas', 'Mais de 4 h'],
];
const animalTypes = [['cachorro', 'Cachorro'], ['gato', 'Gato'], ['coelho', 'Coelho'], ['passaro', 'Pássaro'], ['outro', 'Outro']];
const energyLevels = [
  ['muito baixo', 'Muito baixa'], ['baixo', 'Baixa'], ['moderado', 'Moderada'],
  ['alto', 'Alta'], ['muito alto', 'Muito alta'],
];

export default function AdoptionsScreen() {
  const [step, setStep] = useState<Step>('adopter');
  const [adopter, setAdopter] = useState(emptyAdopter);
  const [pet, setPet] = useState(emptyPet);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateAdopter(field: AdopterField, value: string) {
    setAdopter((current) => ({ ...current, [field]: value }));
    setError('');
  }
  function updatePet(field: PetField, value: string) {
    setPet((current) => ({ ...current, [field]: value }));
    setError('');
  }
  async function runAnalysis() {
    if (!pet.type || !pet.breed.trim()) {
      setError('Selecione o tipo e informe a raça ou descrição do pet.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setResult(await analyzeCompatibility({ adopter, pet }));
      setStep('result');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }
  function reset() {
    setAdopter({ ...emptyAdopter });
    setPet({ ...emptyPet });
    setResult(null);
    setError('');
    setStep('adopter');
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Sparkles color={colors.white} size={23} /></View>
          <Text style={styles.eyebrow}>ADOÇÃO RESPONSÁVEL</Text>
          <Text style={styles.title}>Compatibilidade com IA</Text>
          <Text style={styles.heroText}>Descubra como a sua rotina e o perfil do pet podem combinar.</Text>
        </View>

        <View style={styles.steps}>
          <StepIndicator number="1" label="Adotante" active={step === 'adopter'} complete={step !== 'adopter'} />
          <View style={[styles.stepLine, step !== 'adopter' && styles.stepLineDone]} />
          <StepIndicator number="2" label="Pet" active={step === 'pet'} complete={step === 'result'} />
          <View style={[styles.stepLine, step === 'result' && styles.stepLineDone]} />
          <StepIndicator number="3" label="Resultado" active={step === 'result'} complete={false} />
        </View>

        {step === 'adopter' && <View style={styles.card}>
          <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Heart color={colors.action} size={19} /></View><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Sobre você</Text><Text style={styles.sectionHint}>Conte um pouco da sua rotina e do seu lar.</Text></View></View>
          <ChoiceField label="Espaço de moradia" value={adopter.livingSpace} options={livingSpaces} onSelect={(value) => updateAdopter('livingSpace', value)} />
          <ChoiceField label="Experiência com animais" value={adopter.experience} options={experiences} onSelect={(value) => updateAdopter('experience', value)} />
          <ChoiceField label="Tempo disponível por dia" value={adopter.timeAvailable} options={availabilities} onSelect={(value) => updateAdopter('timeAvailable', value)} />
          <TextField label="Composição familiar" placeholder="Ex.: casal com duas crianças" value={adopter.familyComposition} onChangeText={(value) => updateAdopter('familyComposition', value)} />
          <TextField label="Estilo de vida" placeholder="Ex.: trabalho em casa, passeios ao ar livre..." value={adopter.lifestyle} onChangeText={(value) => updateAdopter('lifestyle', value)} multiline />
          <PrimaryButton label="Continuar para o perfil do pet" icon={<ArrowRight color="white" size={18} />} disabled={!adopter.livingSpace || !adopter.experience || !adopter.timeAvailable} onPress={() => { setError(''); setStep('pet'); }} />
        </View>}

        {step === 'pet' && <View style={styles.card}>
          <View style={styles.sectionHeader}><View style={styles.sectionIcon}><PawPrint color={colors.action} size={19} /></View><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Sobre o pet</Text><Text style={styles.sectionHint}>Use as informações disponíveis sobre o animal.</Text></View></View>
          <ChoiceField label="Tipo de animal" value={pet.type} options={animalTypes} onSelect={(value) => updatePet('type', value)} />
          <TextField label="Raça ou descrição" placeholder="Ex.: vira-lata de porte médio" value={pet.breed} onChangeText={(value) => updatePet('breed', value)} />
          <TextField label="Temperamento" placeholder="Ex.: dócil, brincalhão, sociável" value={pet.temperament} onChangeText={(value) => updatePet('temperament', value)} />
          <ChoiceField label="Nível de energia" value={pet.energy} options={energyLevels} onSelect={(value) => updatePet('energy', value)} />
          <TextField label="Necessidades especiais" placeholder="Alergias, medicações ou outros cuidados" value={pet.specialNeeds} onChangeText={(value) => updatePet('specialNeeds', value)} multiline />
          <TextField label="Descrição adicional" placeholder="Outras informações importantes sobre o pet" value={pet.description} onChangeText={(value) => updatePet('description', value)} multiline />
          <View style={styles.buttonRow}>
            <Pressable style={styles.backButton} onPress={() => { setError(''); setStep('adopter'); }}><ArrowLeft color={colors.brandPanel} size={17} /><Text style={styles.backText}>Voltar</Text></Pressable>
            <PrimaryButton label={loading ? 'Analisando...' : 'Analisar compatibilidade'} icon={loading ? <ActivityIndicator color="white" size="small" /> : <Sparkles color="white" size={17} />} disabled={loading || !pet.type || !pet.breed.trim()} onPress={() => void runAnalysis()} compact />
          </View>
        </View>}

        {step === 'result' && result && <ResultView result={result} onReset={reset} onEdit={() => { setStep('pet'); setError(''); }} />}

        {!!error && <View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
        <Text style={styles.disclaimer}>A análise é uma orientação inicial. Considere sempre as necessidades do animal e converse com a organização responsável pela adoção.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepIndicator({ number, label, active, complete }: { number: string; label: string; active: boolean; complete: boolean }) {
  return <View style={styles.stepItem}><View style={[styles.stepCircle, active && styles.stepCircleActive, complete && styles.stepCircleComplete]}>{complete ? <Check size={14} color="white" /> : <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{number}</Text>}</View><Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text></View>;
}

function ChoiceField({ label, value, options, onSelect }: { label: string; value: string; options: string[][]; onSelect: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}<Text style={styles.required}> *</Text></Text><View style={styles.choices}>{options.map(([optionValue, title]) => { const selected = value === optionValue; return <Pressable key={optionValue} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => onSelect(optionValue)} style={[styles.choice, selected && styles.choiceActive]}><Text style={[styles.choiceText, selected && styles.choiceTextActive]}>{title}</Text></Pressable>; })}</View></View>;
}

function TextField({ label, placeholder, value, onChangeText, multiline = false }: { label: string; placeholder: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}<Text style={styles.optional}> · opcional</Text></Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#89918b" multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} style={[styles.input, multiline && styles.multiline]} /></View>;
}

function PrimaryButton({ label, icon, onPress, disabled = false, compact = false }: { label: string; icon: React.ReactNode; onPress: () => void; disabled?: boolean; compact?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.primaryButton, compact && styles.compactButton, disabled && styles.buttonDisabled]}><Text style={styles.primaryButtonText}>{label}</Text>{icon}</Pressable>;
}

function ResultView({ result, onReset, onEdit }: { result: CompatibilityResult; onReset: () => void; onEdit: () => void }) {
  const scoreColor = result.score >= 80 ? '#168246' : result.score >= 60 ? '#b77912' : '#bd3940';
  const scoreSurface = result.score >= 80 ? '#eaf7ef' : result.score >= 60 ? '#fff6e5' : '#fff0f0';
  return <View style={styles.resultStack}>
    <View style={[styles.scoreCard, { backgroundColor: scoreSurface }]}>
      <View style={styles.scoreTop}><View><Text style={styles.scoreEyebrow}>RESULTADO DA ANÁLISE</Text><Text style={styles.sectionTitle}>Compatibilidade</Text></View><View style={[styles.scoreCircle, { borderColor: scoreColor }]}><Text style={[styles.score, { color: scoreColor }]}>{result.score}%</Text></View></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${result.score}%`, backgroundColor: scoreColor }]} /></View>
      <Text style={styles.scoreCaption}>{result.score >= 80 ? 'Ótima combinação' : result.score >= 60 ? 'Boa combinação, com pontos de atenção' : 'Requer uma avaliação cuidadosa'}</Text>
    </View>
    <ResultSection icon={<Heart color={colors.action} size={19} />} title="Avaliação geral"><Text style={styles.resultBody}>{result.assessment}</Text></ResultSection>
    {result.alerts.length > 0 && <ResultSection icon={<AlertTriangle color="#ba7620" size={19} />} title="Pontos de atenção" tone="warning">{result.alerts.map((alert, index) => <View key={`${index}-${alert}`} style={styles.bulletRow}><View style={styles.warningDot} /><Text style={styles.listText}>{alert}</Text></View>)}</ResultSection>}
    {result.tips.length > 0 && <ResultSection icon={<Lightbulb color={colors.action} size={19} />} title="Dicas para a adoção">{result.tips.map((tip, index) => <View key={`${index}-${tip}`} style={styles.bulletRow}><Check color={colors.action} size={15} /><Text style={styles.listText}>{tip}</Text></View>)}</ResultSection>}
    <Pressable style={styles.primaryButton} onPress={onReset}><Text style={styles.primaryButtonText}>Analisar outro pet</Text><RotateCcw color="white" size={17} /></Pressable>
    <Pressable style={styles.editButton} onPress={onEdit}><Text style={styles.editText}>Ajustar dados deste pet</Text></Pressable>
  </View>;
}

function ResultSection({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone?: 'warning'; children: React.ReactNode }) {
  return <View style={[styles.resultSection, tone === 'warning' && styles.warningSection]}><View style={styles.resultSectionHeading}>{icon}<Text style={styles.resultSectionTitle}>{title}</Text></View><View style={styles.resultSectionContent}>{children}</View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f8f2' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 14 },
  hero: { backgroundColor: colors.brandPanel, borderRadius: 20, padding: 20, overflow: 'hidden' },
  heroIcon: { height: 40, width: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  eyebrow: { color: '#a9edbd', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: 'white', fontSize: 23, fontWeight: '800', marginTop: 5 },
  heroText: { color: '#e4f1e7', fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 330 },
  steps: { paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', gap: 5, minWidth: 58 },
  stepCircle: { height: 28, width: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#c8d4ca', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: colors.action, backgroundColor: '#e8f6ec' }, stepCircleComplete: { borderColor: colors.action, backgroundColor: colors.action },
  stepNumber: { color: '#79847b', fontSize: 12, fontWeight: '700' }, stepNumberActive: { color: colors.action },
  stepLabel: { color: '#79847b', fontSize: 10, fontWeight: '600' }, stepLabelActive: { color: colors.brandPanel, fontWeight: '800' },
  stepLine: { width: 38, height: 2, backgroundColor: '#d7e0d8', marginHorizontal: 3, marginBottom: 16 }, stepLineDone: { backgroundColor: colors.action },
  card: { backgroundColor: 'white', borderRadius: 18, padding: 17, gap: 17, borderWidth: 1, borderColor: '#e8eee8', elevation: 2, shadowColor: '#193421', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 1 }, sectionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#eaf6ed', alignItems: 'center', justifyContent: 'center' }, sectionHeading: { flex: 1, gap: 2 }, sectionTitle: { color: colors.textDark, fontSize: 17, fontWeight: '800' }, sectionHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  field: { gap: 8 }, label: { color: '#2d3930', fontSize: 13, fontWeight: '700' }, required: { color: colors.action }, optional: { color: '#939b94', fontSize: 11, fontWeight: '400' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, choice: { backgroundColor: '#f4f7f4', borderWidth: 1, borderColor: '#e3e9e3', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9 }, choiceActive: { backgroundColor: '#e8f6ec', borderColor: colors.action }, choiceText: { color: '#536057', fontSize: 12, fontWeight: '600' }, choiceTextActive: { color: colors.brandPanel, fontWeight: '800' },
  input: { minHeight: 46, paddingHorizontal: 13, borderRadius: 11, borderWidth: 1, borderColor: '#dfe6df', backgroundColor: '#fbfcfb', color: colors.textDark, fontSize: 14 }, multiline: { minHeight: 82, paddingTop: 12 },
  primaryButton: { minHeight: 48, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 2 }, compactButton: { flex: 1 }, buttonDisabled: { opacity: 0.48 }, primaryButtonText: { color: 'white', fontSize: 13, fontWeight: '800' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, backButton: { minHeight: 46, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#dfe6df', flexDirection: 'row', alignItems: 'center', gap: 5 }, backText: { color: colors.brandPanel, fontSize: 12, fontWeight: '700' },
  errorBox: { padding: 13, borderRadius: 12, backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#f2cbcb' }, errorText: { color: colors.errorText, fontSize: 13, lineHeight: 19 },
  disclaimer: { color: '#839087', fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 6 },
  resultStack: { gap: 12 }, scoreCard: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e5ece5' }, scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, scoreEyebrow: { color: '#748078', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }, scoreCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }, score: { fontSize: 20, fontWeight: '900' }, progressTrack: { height: 8, backgroundColor: 'rgba(31,31,31,.09)', borderRadius: 5, overflow: 'hidden', marginTop: 16 }, progressFill: { height: '100%', borderRadius: 5 }, scoreCaption: { color: '#59645c', fontSize: 12, fontWeight: '700', marginTop: 8 },
  resultSection: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e8eee8' }, warningSection: { backgroundColor: '#fffbf3', borderColor: '#f2e5c9' }, resultSectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, resultSectionTitle: { color: colors.textDark, fontSize: 14, fontWeight: '800' }, resultSectionContent: { gap: 10, marginTop: 12 }, resultBody: { color: '#4d5850', fontSize: 14, lineHeight: 21 }, bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, warningDot: { height: 7, width: 7, borderRadius: 4, backgroundColor: '#ba7620', marginTop: 6 }, listText: { flex: 1, color: '#4d5850', fontSize: 13, lineHeight: 19 }, editButton: { alignItems: 'center', padding: 11 }, editText: { color: colors.brandPanel, fontWeight: '700', fontSize: 13 },
});
