// Shared by the standalone demos and the collection's opt-in live verifier.
// The caller supplies only a freshly generated, exclusively owned fixture plan.
export async function executeFixture(plan, execute, {
  verify=()=>{}, log=()=>{}, onStep=()=>{},
}={}) {
  const results=[];
  let primaryError;
  const cleanupErrors=[];
  try {
    for (const step of plan.filter(step=>step.phase!=='cleanup')) {
      onStep(step);
      const result=await execute(step);
      await verify(step,result);
      results.push({phase:step.phase,result});
      log(JSON.stringify({phase:step.phase,result},null,2));
    }
  } catch(error) { primaryError=error; }
  // Never retry writes, including cleanup: a lost response may hide success.
  for (const step of plan.filter(step=>step.phase==='cleanup')) {
    try {
      onStep(step);
      const result=await execute(step);
      await verify(step,result);
      log('Removed owned fixture');
    } catch(error) { cleanupErrors.push(error); }
  }
  if (cleanupErrors.length) {
    const error=new Error(`${primaryError ? 'Demo failed; ' : ''}cleanup could not be confirmed. Inspect the owned fixture manually.`);
    error.cause=primaryError;
    error.cleanupErrors=cleanupErrors;
    throw error;
  }
  if (primaryError) throw primaryError;
  return results;
}
