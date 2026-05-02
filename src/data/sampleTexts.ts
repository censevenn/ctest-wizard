export type SampleText = {
  id: string;
  title: string;
  level: "B2" | "C1" | "Custom";
  topic: string;
  text: string;
};

export const sampleTexts: SampleText[] = [
  {
    id: "klimawandel",
    title: "Klimawandel und Gesellschaft",
    level: "B2",
    topic: "Umwelt",
    text:
      "Der Klimawandel ist eine der größten Herausforderungen unserer Zeit. Wissenschaftler warnen seit Jahrzehnten vor den Folgen der globalen Erwärmung. Viele Regierungen haben bereits Maßnahmen ergriffen, um den Ausstoß von Treibhausgasen zu reduzieren. Dennoch reichen diese Schritte oft nicht aus, um die gesteckten Ziele zu erreichen. Auch jeder Einzelne kann durch sein Verhalten zum Schutz des Klimas beitragen. Eine bewusste Ernährung und der Verzicht auf unnötige Flugreisen sind wichtige Beispiele.",
  },
  {
    id: "digitalisierung",
    title: "Digitalisierung der Arbeitswelt",
    level: "C1",
    topic: "Gesellschaft",
    text:
      "Die Digitalisierung verändert die Arbeitswelt grundlegend und in einem rasanten Tempo. Viele klassische Berufe verschwinden, während gleichzeitig völlig neue Tätigkeitsfelder entstehen. Besonders Routineaufgaben werden zunehmend von Maschinen und Algorithmen übernommen. Dadurch gewinnen kreative und soziale Kompetenzen deutlich an Bedeutung. Unternehmen müssen ihre Mitarbeiter regelmäßig weiterbilden, um konkurrenzfähig zu bleiben. Lebenslanges Lernen wird damit zu einer zentralen Voraussetzung für beruflichen Erfolg.",
  },
  {
    id: "studium",
    title: "Studium in Deutschland",
    level: "B2",
    topic: "Bildung",
    text:
      "Deutschland gehört zu den beliebtesten Studienländern der Welt. Jedes Jahr kommen Hunderttausende internationale Studierende an deutsche Hochschulen. Die meisten Universitäten erheben keine Studiengebühren, sondern nur einen geringen Semesterbeitrag. Allerdings müssen ausländische Bewerber häufig ein Studienkolleg besuchen, bevor sie zugelassen werden. Dort werden sie sprachlich und fachlich auf das Studium vorbereitet. Eine bestandene Feststellungsprüfung öffnet schließlich die Tür zur Hochschule.",
  },
];
