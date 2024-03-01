'use client'

import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {getInstallments, initMercadoPago} from '@mercadopago/sdk-react'
import {createCardToken} from '@mercadopago/sdk-react/coreMethods'
import {useEffect, useState} from "react";


export default function Home() {

    initMercadoPago('TEST-059b6f26-9a09-4f97-a931-4ca801e64171');

    const [cardNumber, setCardNumber] = useState<string>('');
    const [transactionAmount, setTransactionAmount] = useState<float>(0);
    const [email, setEmail] = useState<string>('');
    const [cardHolder, setCardHolder] = useState<string>('');
    const [identificationType, setIdentificationType] = useState<string>('');
    const [identificationNumber, setIdentificationNumber] = useState<string>('');
    const [installmentsPayload, setInstallmentsPayload] = useState();
    const [installments, setInstallments] = useState<int>(1);
    const [installmentOptions, setInstallmentOptions] = useState<int>(1);
    const [expirationMonth, setExpirationMonth] = useState<int>();
    const [expirationYear, setExpirationYear] = useState<int>();
    const [cvv, setCvv] = useState<int>();
    const [paymentMethodId, setPaymentMethodId] = useState<int>();


    useEffect(() => {
        const x = async () => {
            const sanitizedCardNumber = cardNumber.replace(/[^0-9]/g, '');
            if (transactionAmount !== 0 && cardNumber !== '' && sanitizedCardNumber.length >= 8) {
                setInstallmentsPayload({
                    payload: {
                        amount: transactionAmount, bin: sanitizedCardNumber.substring(0, 8)
                    }, hasChanged: true,
                });
            }
        }
        x();
    }, [cardNumber, transactionAmount])

    const updateInstallmentOptions = async () => {
        try {
            if (installmentsPayload !== undefined && installmentsPayload.hasChanged) {
                const response = await getInstallments(installmentsPayload.payload)
                setInstallmentOptions(response[0].payer_costs)
                setPaymentMethodId(response[0].payment_method_id)
                installmentsPayload.hasChanged = false;
            }
        } catch (e) {
        }
    }

    const handleFormSubmit = async(e) => {

        e.preventDefault()

        const requestBody = {
            transaction_amount: transactionAmount,
            installments: installments,
            token: (await createCardToken({
                cardNumber: cardNumber.replace(/[^0-9]/g, ''),
                cardholderName: cardHolder,
                cardExpirationMonth: expirationMonth,
                cardExpirationYear: expirationYear,
                securityCode: cvv,
                identificationType: identificationType,
                identificationNumber: identificationNumber,
            })).id,
            payment_method_id: paymentMethodId,
            payer: {
                email: email,
                identification: {
                    type: identificationType,
                    number: identificationNumber,
                }
            }
        };

        const options = {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'User-Agent': 'insomnia/2023.5.8'},
            body: JSON.stringify(requestBody)
        };

        const response = await fetch('http://localhost:9501/rest/payments', options)

        if (response.status === 201) {
            alert('Pagamento registrado com sucesso!');
            location.reload()
        }

    }

    return (<main className="justify-center min-h-screen p-8">
        <form onSubmit={handleFormSubmit} className={"grid grid-cols-1"} method={"POST"}>
            <div className="grid grid-cols-2 gap-8">
                <Card className="">
                    <CardHeader>
                        <h3 className="font-bold">Dados do pagador</h3>
                    </CardHeader>
                    <CardContent>
                        <Input onChange={(event) => setEmail(event.target.value)} className="mb-2 mt-2" type={"text"}
                               name={"email"} id={"email"} placeholder={"Email"}></Input>
                        <Select onValueChange={(event) => setIdentificationType(event)}>
                            <SelectTrigger className="mb-2 mt-2">
                                <SelectValue placeholder="Tipo de identificação"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CPF">CPF</SelectItem>
                                <SelectItem value="CNPJ">CNPJ</SelectItem>
                            </SelectContent>
                        </Select>
                        <Label htmlFor={"identificationNumber"}>
                            <Input onChange={(event) => setIdentificationNumber(event.target.value)} type={"text"}
                                   name={"identificationNumber"} id={"identificationNumber"}
                                   placeholder="Número de identificação"></Input>
                        </Label>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h3 className="font-bold">Dados do pagamento</h3>
                    </CardHeader>
                    <CardContent>
                        <Input onChange={(event) => setTransactionAmount(event.target.value)} className="mb-2 mt-2"
                               type={"float"} placeholder={"Valor do pagamento"}></Input>
                        <Input onChange={(event) => setCardNumber(event.target.value)} className="mb-2 mt-2"
                               type={"text"} placeholder={"Número do cartão"}></Input>
                        <Input onChange={(event) => setCardHolder(event.target.value)} className="mb-2 mt-2" type={"text"}
                               placeholder={"Nome do titular"}></Input>
                        <Input onChange={(event) => setExpirationMonth(event.target.value)} className="mb-2 mt-2" type={"number"}
                               placeholder={"Mês de inspiração (MM)"}></Input>
                        <Input onChange={(event) => setExpirationYear(event.target.value)} className="mb-2 mt-2" type={"number"}
                               placeholder={"Nome do titular (YYYY)"}></Input>
                        <Input onChange={(event) => setCvv(event.target.value)} className="mb-2 mt-2" type={"number"}
                               placeholder={"CVV"}></Input>
                        <select
                            defaultValue={'0'}
                            onChange={(event) => {
                                setInstallments(event.target.value);
                            }}
                            onMouseEnter={updateInstallmentOptions}
                            className={"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"}>
                            <option value={'0'} onChange={(e) => setInstallments(e.target.value)}>Selecione uma
                                opção
                            </option>
                            {installmentOptions && installmentOptions.length > 0 ? installmentOptions.map((option, key) => (
                                <option key={key}
                                        value={option.installments}
                                >
                                    {option.recommended_message}
                                </option>)) : <option value={'0'}>Trabalhando nisso...</option>}
                        </select>
                    </CardContent>
                </Card>
            </div>
            <Button className="mt-4">Pagar</Button>
        </form>
    </main>);
}
