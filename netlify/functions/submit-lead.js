exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' }
  let data
  try { data = JSON.parse(event.body) } catch (e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }
  const { firstName, lastName, businessName, email, phone, cityState, niche, gbpUrl, dataOrg, notes, package: pkg, websiteAddon, total } = data
  const GHL_API_KEY = process.env.GHL_API_KEY
  const GHL_LOCATION = process.env.GHL_LOCATION_ID
  if (!GHL_API_KEY || !GHL_LOCATION) { return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error' }) } }
  const tags = ['Website Checkout', pkg === 'growth' ? 'Package: Growth' : pkg === 'authority' ? 'Package: Authority' : 'Package: Website Only', websiteAddon ? 'Add-on: Website' : null, niche ? `Niche: ${niche}` : null].filter(Boolean)
  try {
    const ghlRes = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GHL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId: GHL_LOCATION, firstName, lastName, name: `${firstName} ${lastName}`, email, phone, companyName: businessName, address1: cityState, source: 'Website Checkout', tags }),
    })
    const ghlData = await ghlRes.json()
    if (ghlRes.ok && ghlData.contact) {
      const noteText = `New checkout — ${new Date().toUTCString()}\nPackage: ${pkg}${websiteAddon ? ' + website' : ''} ($${total}/mo)\nBusiness: ${businessName}\nNiche: ${niche}\nLocation: ${cityState}\nData org: ${dataOrg || 'not provided'}/5\nGBP: ${gbpUrl || 'not provided'}\nNotes: ${notes || 'none'}`
      await fetch(`https://rest.gohighlevel.com/v1/contacts/${ghlData.contact.id}/notes/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GHL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteText }),
      })
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, contactId: ghlData.contact.id }) }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: false }) }
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: false }) }
  }
}
