import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { type, useDemo } from '../components/Lab';
import { Garden } from '../assetlib/Garden';

type Filter = 'all' | 'open' | 'done';
export default function TasksScreen() {
  const { tasks, toggleTask, addTask } = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const done = tasks.filter(task => task.done).length;
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  const submit = () => {
    if (addTask(draft)) { setDraft(''); setFilter('all'); setMessage('Added to your list.'); }
    else setMessage(tasks.length >= 100 ? 'This sample holds up to 100 tasks.' : 'Write a little task first.');
  };
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}><Text style={styles.brand}>daylight<Text style={styles.dot}>.</Text></Text></View>
      <View style={styles.intro}><Text style={styles.title}>Make room{ '\n' }for the good.</Text><Text style={styles.subtitle}>A small list. A little more headspace.</Text></View>
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}><Text style={styles.progressTitle}>{tasks.length > 0 && done === tasks.length ? 'Look at you go.' : 'Small steps count.'}</Text><Text style={styles.progressSubtitle} accessibilityLiveRegion="polite">{done} of {tasks.length} done today</Text><View style={styles.track}><View style={[styles.progressFill, { width: `${tasks.length ? done / tasks.length * 100 : 0}%` }]} /></View></View>
        <Garden done={done} total={tasks.length} style={styles.garden} />
      </View>
      <View style={styles.listHeading}><Text style={styles.listTitle}>Today’s little list</Text><Text style={styles.listCount}>{tasks.length - done} left</Text></View>
      <View style={styles.filters}>{(['all', 'open', 'done'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Done'} tasks`} accessibilityState={{ selected: filter === value }} aria-pressed={filter === value} onPress={() => { setFilter(value); setMessage(''); }} style={[styles.filter, filter === value && styles.filterSelected]}><Text style={[styles.filterText, filter === value && styles.filterTextSelected]}>{value === 'all' ? 'All' : value === 'open' ? 'To do' : 'Done'}</Text></Pressable>)}</View>
      <View style={styles.taskList}>{visible.map(task => <Pressable key={task.id} accessibilityRole="checkbox" accessibilityLabel={task.title} accessibilityState={{ checked: task.done }} aria-checked={task.done} onPress={() => { toggleTask(task.id); setMessage(''); }} style={({ pressed }) => [styles.task, pressed && styles.taskPressed]}>
        <View style={[styles.checkbox, task.done && styles.checked]}>{task.done && <Text style={styles.check}>✓</Text>}</View><View style={styles.taskCopy}><Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text><Text style={styles.taskCategory}>{task.category}</Text></View>
      </Pressable>)}</View>
      {visible.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>{filter === 'done' ? 'Good things take a moment.' : 'A little room to breathe.'}</Text><Text style={styles.emptyBody}>{filter === 'done' ? 'Check off a task and it will appear here.' : 'Everything on your list is done. Enjoy it.'}</Text></View>}
      <View style={styles.inputGroup}><Text style={styles.inputLabel}>Add a task</Text><View style={styles.inputRow}><TextInput accessibilityLabel="New task" placeholder="Write it down…" placeholderTextColor="#858c82" value={draft} onChangeText={value => { setDraft(value); setMessage(''); }} onSubmitEditing={submit} returnKeyType="done" maxLength={100} style={styles.input} /><Pressable accessibilityRole="button" accessibilityLabel="Add task" onPress={submit} style={styles.addButton}><Text style={styles.addIcon}>+</Text></Pressable></View><Text accessibilityLiveRegion="polite" style={styles.message}>{message || 'Just for you. This list stays in this session.'}</Text></View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 28 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, brand: { fontFamily: type.bold, fontSize: 26, letterSpacing: -1.2, color: '#244a3d' }, dot: { color: '#b98f3d' }, 
  intro: { paddingTop: 28, paddingBottom: 24 }, title: { fontFamily: type.display, fontSize: 46, lineHeight: 51, letterSpacing: -1.7, color: '#284d3e' }, subtitle: { fontFamily: type.regular, color: '#677162', fontSize: 14, lineHeight: 22, marginTop: 14 },
  progressCard: { flexDirection: 'row', padding: 20, paddingRight: 0, borderRadius: 9, backgroundColor: '#edf0e8', alignItems: 'center', minHeight: 125, overflow: 'hidden' }, progressCopy: { flex: 1, minWidth: 130 }, progressTitle: { fontFamily: type.bold, fontSize: 15, color: '#35533f' }, progressSubtitle: { fontFamily: type.regular, color: '#5c6b53', fontSize: 12, marginTop: 6 }, track: { height: 5, backgroundColor: '#d7decc', borderRadius: 4, marginTop: 18, overflow: 'hidden' }, progressFill: { height: 5, backgroundColor: '#65865a', borderRadius: 4 }, garden: { width: '40%', height: 100 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 33, gap: 8 }, listTitle: { fontFamily: type.display, fontSize: 24, letterSpacing: -0.7, color: '#2d4b3b' }, listCount: { fontFamily: type.regular, fontSize: 12, color: '#69755e' }, filters: { flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 6 }, filter: { minHeight: 44, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 22 }, filterSelected: { backgroundColor: '#e7eddf' }, filterText: { fontFamily: type.medium, fontSize: 13, color: '#6b7863' }, filterTextSelected: { color: '#365b3e' },
  taskList: { marginTop: 5 }, task: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 88, borderBottomWidth: 1, borderBottomColor: '#e4e7dc', paddingVertical: 18 }, taskPressed: { opacity: 0.65 }, checkbox: { width: 25, height: 25, borderRadius: 8, borderColor: '#b9c3ad', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: '#56734a', borderColor: '#56734a' }, check: { fontSize: 15, color: '#fff', fontFamily: type.bold }, taskCopy: { flex: 1 }, taskTitle: { fontFamily: type.medium, color: '#354c3a', fontSize: 14, lineHeight: 21 }, taskTitleDone: { color: '#798572', textDecorationLine: 'line-through' }, taskCategory: { fontFamily: type.regular, fontSize: 12, color: '#788269', marginTop: 4 },
  empty: { paddingVertical: 32, gap: 9 }, emptyTitle: { fontFamily: type.display, fontSize: 22, color: '#38563f' }, emptyBody: { fontFamily: type.regular, fontSize: 14, lineHeight: 22, color: '#6c7762' },
  inputGroup: { marginTop: 26 }, inputLabel: { fontFamily: type.medium, fontSize: 13, color: '#35533f', marginBottom: 10 }, inputRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#d7dfcc', borderRadius: 10, padding: 5, backgroundColor: '#fff', alignItems: 'center' }, input: { flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: 12, fontFamily: type.regular, color: '#35533f', fontSize: 14 }, addButton: { width: 46, height: 46, borderRadius: 7, backgroundColor: '#31573f', alignItems: 'center', justifyContent: 'center' }, addIcon: { fontSize: 27, fontFamily: type.regular, color: '#fff' }, message: { minHeight: 34, fontFamily: type.regular, color: '#6a7760', fontSize: 11, lineHeight: 17, paddingTop: 9 },
});
