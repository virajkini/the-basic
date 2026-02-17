import {test,expect} from '@playwright/test'

test('Login Validations', async({browser})=>{

    const phoneNum= "8494943808"
    const otp= "3808"
    const context= await browser.newContext();
    const page= await context.newPage();

    await page.goto("https://amgeljodi.com/")
    await page.getByRole('button', { name: 'Login', exact: true }).first().click();
    await page.locator(".mb-4 .px-4").fill(phoneNum)
    await page.locator("button[type='submit']").click();
    await page.locator("input[inputmode='numeric']").fill(otp)
    await page.locator("button[type='submit']").click();
    await page.getByRole('link', { name: 'Connections' }).click();
})