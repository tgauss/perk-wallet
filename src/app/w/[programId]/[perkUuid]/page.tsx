export default function MagicInstallPage({
  params,
}: {
  params: { programId: string; perkUuid: string };
}) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Perk Wallet Install</h1>
      <p>Program ID: {params.programId}</p>
      <p>Perk UUID: {params.perkUuid}</p>
      <p>This is the universal install page. Buttons coming next.</p>
    </main>
  );
}
