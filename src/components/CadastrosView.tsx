import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  PlusCircle,
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Hash, 
  Layers, 
  Clock, 
  Check, 
  X,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { Teacher, Subject, ClassGroup, BimonthlyPlan, BiweeklyMeeting } from '../types';

interface CadastrosViewProps {
  teachers: Teacher[];
  subjects: Subject[];
  classGroups: ClassGroup[];
  bimonthlyPlans: BimonthlyPlan[];
  meetings: BiweeklyMeeting[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onAddClassGroup: (classGroup: ClassGroup) => void;
  onUpdateClassGroup: (classGroup: ClassGroup) => void;
  onDeleteClassGroup: (classGroupId: string) => void;
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
}

type CadastroSubTab = 'teachers' | 'classes' | 'subjects';

export const CadastrosView: React.FC<CadastrosViewProps> = ({
  teachers,
  subjects,
  classGroups,
  bimonthlyPlans,
  meetings,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddClassGroup,
  onUpdateClassGroup,
  onDeleteClassGroup,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CadastroSubTab>('teachers');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);

  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);

  const [itemToDelete, setItemToDelete] = useState<{
    type: 'teacher' | 'class' | 'subject';
    id: string;
    name: string;
    warningMessage?: string;
  } | null>(null);

  // Form states for Teacher
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherSelectedSubjects, setTeacherSelectedSubjects] = useState<string[]>([]);
  const [teacherSelectedClasses, setTeacherSelectedClasses] = useState<string[]>([]);

  // Form states for Class
  const [className, setClassName] = useState('');
  const [classShift, setClassShift] = useState<'Matutino' | 'Vespertino' | 'Noturno'>('Matutino');
  const [classTotalStudents, setClassTotalStudents] = useState<number>(30);

  // Form states for Subject
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectHours, setSubjectHours] = useState<number>(80);

  // Open Teacher Modal
  const openTeacherModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setTeacherName(teacher.name);
      setTeacherEmail(teacher.email || '');
      setTeacherSelectedSubjects(teacher.subjects || []);
      setTeacherSelectedClasses(teacher.classes || []);
    } else {
      setEditingTeacher(null);
      setTeacherName('');
      setTeacherEmail('');
      setTeacherSelectedSubjects([]);
      setTeacherSelectedClasses([]);
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;

    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `prof-${Date.now()}`,
      name: teacherName.trim(),
      email: teacherEmail.trim(),
      subjects: teacherSelectedSubjects,
      classes: teacherSelectedClasses
    };

    if (editingTeacher) {
      onUpdateTeacher(teacherData);
    } else {
      onAddTeacher(teacherData);
    }

    setIsTeacherModalOpen(false);
  };

  // Open Class Modal
  const openClassModal = (cls?: ClassGroup) => {
    if (cls) {
      setEditingClass(cls);
      setClassName(cls.name);
      setClassShift(cls.shift);
      setClassTotalStudents(cls.totalStudents);
    } else {
      setEditingClass(null);
      setClassName('');
      setClassShift('Matutino');
      setClassTotalStudents(30);
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    const classData: ClassGroup = {
      id: editingClass ? editingClass.id : `turma-${Date.now()}`,
      name: className.trim(),
      shift: classShift,
      totalStudents: Number(classTotalStudents) || 30
    };

    if (editingClass) {
      onUpdateClassGroup(classData);
    } else {
      onAddClassGroup(classData);
    }

    setIsClassModalOpen(false);
  };

  // Open Subject Modal
  const openSubjectModal = (subj?: Subject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjectName(subj.name);
      setSubjectCode(subj.id || subj.code || '');
      setSubjectHours(subj.totalWorkloadHours || 80);
    } else {
      setEditingSubject(null);
      setSubjectName('');
      setSubjectCode('');
      setSubjectHours(80);
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    // O ID é o próprio código/sigla da disciplina (ex: MAT, LP, HIST)
    const normalizedId = (subjectCode.trim() || subjectName.trim().slice(0, 4)).toUpperCase().replace(/\s+/g, '_');
    const finalId = editingSubject ? editingSubject.id : normalizedId;

    const subjectData: Subject = {
      id: finalId,
      name: subjectName.trim(),
      code: finalId,
      totalWorkloadHours: Number(subjectHours) || 80
    };

    if (editingSubject) {
      onUpdateSubject(subjectData);
    } else {
      onAddSubject(subjectData);
    }

    setIsSubjectModalOpen(false);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'teacher') {
      onDeleteTeacher(itemToDelete.id);
    } else if (itemToDelete.type === 'class') {
      onDeleteClassGroup(itemToDelete.id);
    } else if (itemToDelete.type === 'subject') {
      onDeleteSubject(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  // Filtered lists
  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredClasses = classGroups.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.shift.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-100 flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-indigo-400" />
            <span>Gestão de Cadastros</span>
          </h2>
        </div>

        {/* Action Button based on active subtab */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'teachers' && (
            <button
              onClick={() => openTeacherModal()}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>Novo Professor</span>
            </button>
          )}

          {activeSubTab === 'classes' && (
            <button
              onClick={() => openClassModal()}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>Nova Turma</span>
            </button>
          )}

          {activeSubTab === 'subjects' && (
            <button
              onClick={() => openSubjectModal()}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>Nova Disciplina</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Nav & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setActiveSubTab('teachers'); setSearchTerm(''); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'teachers'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Professores</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {teachers.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveSubTab('classes'); setSearchTerm(''); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'classes'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Turmas</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {classGroups.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveSubTab('subjects'); setSearchTerm(''); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'subjects'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Disciplinas</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {subjects.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'teachers' ? 'Buscar docente ou email...' :
              activeSubTab === 'classes' ? 'Buscar turma ou turno...' :
              'Buscar disciplina ou código...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TEACHERS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'teachers' && (
        filteredTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map(teacher => {
              const teacherMeetings = meetings.filter(m => m.teacherId === teacher.id);
              const teacherPlans = bimonthlyPlans.filter(p => p.teacherId === teacher.id);

              return (
                <div 
                  key={teacher.id} 
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Avatar, Name, Email */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                          {teacher.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{teacher.name}</h4>
                          {teacher.email ? (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {teacher.email}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sem e-mail cadastrado</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openTeacherModal(teacher)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar Professor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({
                            type: 'teacher',
                            id: teacher.id,
                            name: teacher.name,
                            warningMessage: teacherMeetings.length > 0 
                              ? `Atenção: Este professor possui ${teacherMeetings.length} reunião(ões) vinculada(s).` 
                              : undefined
                          })}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Professor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Associated Subjects */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>Disciplinas Vinculadas</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          teacher.subjects.map(sRef => {
                            const sub = subjects.find(s => s.id === sRef || s.name.toLowerCase() === sRef.toLowerCase() || (s.code && s.code.toLowerCase() === sRef.toLowerCase()));
                            return (
                              <span 
                                key={sRef} 
                                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {sub?.name || sRef}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Nenhuma selecionada</span>
                        )}
                      </div>
                    </div>

                    {/* Associated Classes */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        <span>Turmas Vinculadas</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.classes && teacher.classes.length > 0 ? (
                          teacher.classes.map(cRef => {
                            const cls = classGroups.find(c => c.id === cRef || c.name.toLowerCase() === cRef.toLowerCase());
                            return (
                              <span key={cRef} className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {cls?.name || cRef}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Nenhuma selecionada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{teacherPlans.length} planejamentos</span>
                    <span className="font-semibold text-indigo-600">{teacherMeetings.length} reuniões</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Nenhum professor cadastrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cadastre professores individualmente ou sincronize os dados existentes na Planilha Google.
            </p>
            <button
              onClick={() => openTeacherModal()}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>Cadastrar Primeiro Professor</span>
            </button>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 2. CLASSES LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'classes' && (
        filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map(cls => {
              const classMeetings = meetings.filter(m => m.classGroupId === cls.id);
              const classTeachers = teachers.filter(t => t.classes?.some(c => c === cls.id || c === cls.name));

              return (
                <div 
                  key={cls.id} 
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{cls.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {cls.shift}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {cls.totalStudents} estudantes
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openClassModal(cls)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar Turma"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({
                            type: 'class',
                            id: cls.id,
                            name: cls.name,
                            warningMessage: classMeetings.length > 0 
                              ? `Atenção: Existem ${classMeetings.length} reunião(ões) vinculada(s) a esta turma.` 
                              : undefined
                          })}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Turma"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Professores Atuantes ({classTeachers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {classTeachers.slice(0, 4).map(t => (
                          <span key={t.id} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                            {t.name}
                          </span>
                        ))}
                        {classTeachers.length > 4 && (
                          <span className="text-[10px] text-slate-400">+{classTeachers.length - 4} mais</span>
                        )}
                        {classTeachers.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">Nenhum professor vinculado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>ID: {cls.id}</span>
                    <span className="font-semibold text-indigo-600">{classMeetings.length} reuniões</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Nenhuma turma cadastrada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Adicione turmas (ex: 1º Ano A, 2º Ano B) para organizar os acompanhamentos.
            </p>
            <button
              onClick={() => openClassModal()}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>Cadastrar Primeira Turma</span>
            </button>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 3. SUBJECTS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'subjects' && (
        filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map(subj => {
              const subjMeetings = meetings.filter(m => m.subjectId === subj.id);
              const subjTeachers = teachers.filter(t => t.subjects?.some(s => s === subj.id || s === subj.name || s === subj.code));

              return (
                <div 
                  key={subj.id} 
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{subj.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase font-mono">
                              {subj.id || subj.code}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {subj.totalWorkloadHours}h anuais
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openSubjectModal(subj)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar Disciplina"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({
                            type: 'subject',
                            id: subj.id,
                            name: subj.name,
                            warningMessage: subjMeetings.length > 0 
                              ? `Atenção: Existem ${subjMeetings.length} reunião(ões) vinculada(s) a esta disciplina.` 
                              : undefined
                          })}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Disciplina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Docentes Responsáveis ({subjTeachers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {subjTeachers.map(t => (
                          <span key={t.id} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                            {t.name}
                          </span>
                        ))}
                        {subjTeachers.length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">Nenhum professor vinculado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>ID: {subj.id}</span>
                    <span className="font-semibold text-indigo-600">{subjMeetings.length} reuniões</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Nenhuma disciplina cadastrada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cadastre componentes curriculares (ex: Língua Portuguesa, Matemática) para associar aos professores.
            </p>
            <button
              onClick={() => openSubjectModal()}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>Cadastrar Primeira Disciplina</span>
            </button>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* MODAL: TEACHER CREATE / EDIT */}
      {/* ========================================================================= */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingTeacher ? 'Editar Professor' : 'Cadastrar Novo Professor'}
                </h3>
                <p className="text-xs text-slate-400">Preencha os dados e associações do docente</p>
              </div>
              <button 
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Fernandes dos Santos"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  placeholder="Ex: maria.santos@escola.pb.gov.br"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Disciplinas que Ministra</label>
                {subjects.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                    {subjects.map(s => {
                      const isSelected = teacherSelectedSubjects.includes(s.id) || teacherSelectedSubjects.includes(s.name);
                      return (
                        <label 
                          key={s.id} 
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs transition-all ${
                            isSelected ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setTeacherSelectedSubjects(teacherSelectedSubjects.filter(id => id !== s.id && id !== s.name));
                              } else {
                                setTeacherSelectedSubjects([...teacherSelectedSubjects, s.id]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{s.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhuma disciplina cadastrada ainda.</p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Turmas em que Atua</label>
                {classGroups.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                    {classGroups.map(c => {
                      const isSelected = teacherSelectedClasses.includes(c.id) || teacherSelectedClasses.includes(c.name);
                      return (
                        <label 
                          key={c.id} 
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs transition-all ${
                            isSelected ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setTeacherSelectedClasses(teacherSelectedClasses.filter(id => id !== c.id && id !== c.name));
                              } else {
                                setTeacherSelectedClasses([...teacherSelectedClasses, c.id]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{c.name} ({c.shift[0]})</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhuma turma cadastrada ainda.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow"
                >
                  {editingTeacher ? 'Salvar Alterações' : 'Criar Professor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLASS CREATE / EDIT */}
      {/* ========================================================================= */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingClass ? 'Editar Turma' : 'Cadastrar Nova Turma'}
                </h3>
                <p className="text-xs text-slate-400">Informe os detalhes da turma</p>
              </div>
              <button 
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1º Ano A ou 3º Ano Médio"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Turno</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Matutino', 'Vespertino', 'Noturno'] as const).map(shift => (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => setClassShift(shift)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        classShift === shift 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {shift}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Quantidade de Estudantes</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={classTotalStudents}
                  onChange={(e) => setClassTotalStudents(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow"
                >
                  {editingClass ? 'Salvar Alterações' : 'Criar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBJECT CREATE / EDIT */}
      {/* ========================================================================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-display">
                  {editingSubject ? 'Editar Disciplina' : 'Cadastrar Nova Disciplina'}
                </h3>
                <p className="text-xs text-slate-400">Defina os parâmetros do componente curricular</p>
              </div>
              <button 
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nome da Disciplina *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Língua Portuguesa, Biologia..."
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">ID da Disciplina</label>
                  <input
                    type="text"
                    placeholder="Ex: LP, MAT, BIO"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs uppercase"
                  />
                  <span className="text-[10px] text-slate-400">O ID é usado como código único</span>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Carga Horária (h)</label>
                  <input
                    type="number"
                    min="10"
                    max="400"
                    value={subjectHours}
                    onChange={(e) => setSubjectHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow"
                >
                  {editingSubject ? 'Salvar Alterações' : 'Criar Disciplina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Confirmar Exclusão</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir <strong>"{itemToDelete.name}"</strong>? Esta ação não pode ser desfeita.
            </p>

            {itemToDelete.warningMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                {itemToDelete.warningMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all shadow"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
